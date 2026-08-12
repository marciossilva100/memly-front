import { dispatchPremiumLimitHit } from "../hooks/usePremiumLimitListener";
import { dispatchPrimeiroAudio } from "../hooks/useAudioSpeedHintListener";
import { fetchComTimeout } from "./fetchComTimeout";

let currentAudio = null;
let currentToken = 0;

// Depois que o modal premium por limite de áudio já apareceu uma vez, novas
// tentativas de reprodução caem direto pra voz padrão (free) em vez de
// interromper de novo com o modal. Guardado no localStorage (não só em
// memória) porque uma flag em memória reseta a cada recarregamento - no PWA
// do celular isso acontece toda vez que o app volta do segundo plano,
// fazendo o modal reaparecer repetidamente durante o mesmo treino.
// A chave inclui o user_id porque o localStorage é por dispositivo, não por
// conta - sem isso, um usuário novo testando no mesmo aparelho de uma conta
// que já viu o aviso nunca seria avisado na própria primeira vez.
function chaveAvisoLimiteAudio(user) {
    return `zaldemy_aviso_limite_audio_exibido_${user?.id ?? "anon"}`;
}

// Guarda em memória (além do localStorage) os avisos já disparados nesta
// mesma carga de página - checagem síncrona extra antes de mexer no
// localStorage, como reforço caso o dispositivo tenha algum atraso/
// inconsistência de leitura do localStorage entre chamadas quase
// simultâneas de playAudio (ex: autoplay ao virar o card + preload da
// próxima carta).
const avisosLimiteAudioDisparados = new Set();

// Mostra o aviso de limite (toast lateral) só uma vez por conta - chamado
// tanto de dentro de playAudio (limite descoberto NA hora, tentando tocar)
// quanto de sincronizarCotaNatural (limite já esgotado ANTES da sessão
// começar) - sem isso, quem abre o app com a cota já estourada nunca via
// nenhum aviso, o áudio simplesmente caía pra voz padrão em silêncio.
function avisarLimiteAudioSeNecessario(user) {
    const chaveAviso = chaveAvisoLimiteAudio(user);
    if (avisosLimiteAudioDisparados.has(chaveAviso) || localStorage.getItem(chaveAviso)) {
        return false;
    }
    avisosLimiteAudioDisparados.add(chaveAviso);
    localStorage.setItem(chaveAviso, "1");
    dispatchPremiumLimitHit("audio");
    return true;
}

// Depois que o servidor confirma limite atingido (plano premium: diário;
// limitado: vitalício) pra uma frase, marca aqui pra TODAS as chamadas
// seguintes (preload E play, de qualquer frase) pularem a voz natural direto
// pra padrão - sem isso, uma frase que já tinha sido pré-carregada com
// sucesso ANTES do limite acabar continuava tocando em voz natural pra
// sempre (o cache de áudio, em memória ou do service worker, nunca era
// invalidado pelo limite de cota estourar depois). Guardado com a data (não
// só um bool) porque o limite do premium é diário - um valor de ontem não
// deve continuar bloqueando hoje; o do limitado é vitalício, mas como o
// backend sempre barra de novo, o pior caso é só 1 chamada extra por dia até
// essa marca ser renovada.
function chaveCotaNaturalEsgotada(user) {
    return `zaldemy_cota_natural_esgotada_${user?.id ?? "anon"}`;
}

function cotaNaturalEsgotada(user) {
    const hoje = new Date().toISOString().slice(0, 10);
    return localStorage.getItem(chaveCotaNaturalEsgotada(user)) === hoje;
}

function marcarCotaNaturalEsgotada(user) {
    const hoje = new Date().toISOString().slice(0, 10);
    localStorage.setItem(chaveCotaNaturalEsgotada(user), hoje);
}

// Trava dura, só pro plano limitado (amostra grátis) - conta REPRODUÇÕES de
// voz natural de verdade, não gerações. O service worker cacheia o áudio
// natural por 1 ano (tts-cache-natural em src/sw.js) pra não gastar cota
// gerando de novo a mesma frase - mas isso também significa que repetir uma
// frase já ouvida nunca bate no backend outra vez, então o contador de cota
// do backend (que só vê gerações) nunca percebe replays infinitos da mesma
// frase pelo cache. Por isso essa trava vive aqui, na função que efetivamente
// toca o áudio (playAudio), contando local e independente de cache - é o
// único lugar por onde toda reprodução de voz natural realmente passa,
// não importa a tela que chamou.
const LIMITE_REPRODUCOES_NATURAL_LIMITADO = 10;

function chaveReproducoesNaturalLimitado(user) {
    return `zaldemy_reproducoes_natural_limitado_${user?.id ?? "anon"}`;
}

function limiteReproducoesLimitadoAtingido(user) {
    if (user?.plano !== 3) return false;
    const contagem = parseInt(localStorage.getItem(chaveReproducoesNaturalLimitado(user)) || "0", 10);
    return contagem >= LIMITE_REPRODUCOES_NATURAL_LIMITADO;
}

// Chamado só depois de uma reprodução de voz natural realmente acontecer
// (nunca em preload, que só busca sem tocar). Retorna true quando essa
// reprodução acabou de atingir o limite.
function registrarReproducaoNaturalLimitado(user) {
    if (user?.plano !== 3) return false;
    const chave = chaveReproducoesNaturalLimitado(user);
    const contagem = parseInt(localStorage.getItem(chave) || "0", 10) + 1;
    localStorage.setItem(chave, String(contagem));
    return contagem >= LIMITE_REPRODUCOES_NATURAL_LIMITADO;
}

// Confirma com o servidor se a cota de voz natural já está esgotada, ANTES
// de qualquer tentativa de tocar áudio - sem isso, se a primeira coisa que o
// usuário faz é repetir uma frase que o service worker já tem em cache (de
// uma sessão anterior, com a cota ainda livre na época), a resposta cacheada
// é servida direto pelo navegador sem passar pelo servidor, e o app nunca
// descobre que a cota acabou nesse meio tempo. Chamado uma vez ao carregar o
// usuário autenticado (ver AuthContext). Não gasta cota - só consulta.
export async function sincronizarCotaNatural(user) {
    if (!user || (user.plano !== 1 && user.plano !== 3)) return;

    const API_URL = import.meta.env.VITE_API_URL;

    try {
        const res = await fetchComTimeout(`${API_URL}/controller/tts.php?action=verificar_limite`, {
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
        });
        const data = await res.json();

        if (data?.limite_atingido) {
            marcarCotaNaturalEsgotada(user);
            avisarLimiteAudioSeNecessario(user);
        }
    } catch (error) {
        console.error('Erro ao sincronizar cota de voz natural:', error);
    }
}

// Cancela o áudio em reprodução (se houver) e invalida qualquer chamada de
// playAudio ainda em andamento (via o token) - usado tanto no início de toda
// nova chamada de playAudio quanto exportado como pararAudio() pra telas que
// precisam interromper sem necessariamente tocar outro áudio em seguida (ex:
// trocar de flashcard enquanto o áudio do card anterior ainda está tocando).
function cancelarAudioAtual() {
    const meuToken = ++currentToken;

    if (currentAudio && currentAudio.pause) {
        currentAudio.pause();
    }

    currentAudio = null;

    return meuToken;
}

export function pararAudio() {
    cancelarAudioAtual();
}

// Cache em memória das buscas de áudio (natural via ElevenLabs e padrão via
// treino.php), por texto+idioma - permite pré-carregar (preloadAudio) assim
// que um card aparece, em vez de só buscar no momento do clique em "Ouvir",
// que é quando o atraso da voz natural é sentido. playAudio consome o mesmo
// cache, então se o preload já rodou, tocar é instantâneo; se não, cai no
// mesmo fetch de sempre.
const CACHE_AUDIO_MAX = 20;
const cacheAudio = new Map(); // chave -> Promise<resultado>

function chaveCacheAudio(tipo, lang, text) {
    return `${tipo}::${lang}::${text}`;
}

function obterOuBuscarAudio(chave, criarPromise) {
    if (!cacheAudio.has(chave)) {
        if (cacheAudio.size >= CACHE_AUDIO_MAX) {
            cacheAudio.delete(cacheAudio.keys().next().value);
        }
        const promise = criarPromise();
        cacheAudio.set(chave, promise);
        // não guarda falha de rede no cache - permite tentar de novo depois
        promise.catch(() => cacheAudio.delete(chave));
    }
    return cacheAudio.get(chave);
}

async function buscarAudiosPadrao(cleanText, voiceLang) {
    const API_URL = import.meta.env.VITE_API_URL;
    const url =
        `${API_URL}/controller/treino.php?action=voice` +
        "&text=" + encodeURIComponent(cleanText) +
        "&lang=" + encodeURIComponent(voiceLang);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Erro HTTP: " + res.status);
    }

    const audios = await res.json();
    if (!Array.isArray(audios) || audios.length === 0) {
        throw new Error("Áudios inválidos");
    }

    return audios;
}

// Pré-busca o(s) áudio(s) de um texto sem tocar, pra já estarem prontos
// quando o usuário clicar em "Ouvir". Mesma regra de elegibilidade de voz
// natural que playAudio - se o limite da voz natural já tiver sido
// atingido (ou der erro), pré-carrega a voz padrão também, como fallback.
export function preloadAudio(text, user, lang = null, forcarVozPadrao = false) {
    if (!text || !user) return;

    const voiceLang = lang || user?.learning_language;

    if (!forcarVozPadrao && !cotaNaturalEsgotada(user) && !limiteReproducoesLimitadoAtingido(user) && (user.plano === 1 || user.plano === 3)) {
        const chaveNatural = chaveCacheAudio("natural", voiceLang, text);
        const promiseNatural = obterOuBuscarAudio(chaveNatural, () => gerarAudio(text));

        promiseNatural.then((resultado) => {
            if (resultado?.limiteAtingido) {
                marcarCotaNaturalEsgotada(user);
            }
            if (!resultado?.url) {
                const cleanText = text.trim().replace(/^"|"$/g, '');
                const chavePadrao = chaveCacheAudio("padrao", voiceLang, cleanText);
                obterOuBuscarAudio(chavePadrao, () => buscarAudiosPadrao(cleanText, voiceLang));
            }
        });
    } else {
        const cleanText = text.trim().replace(/^"|"$/g, '');
        const chavePadrao = chaveCacheAudio("padrao", voiceLang, cleanText);
        obterOuBuscarAudio(chavePadrao, () => buscarAudiosPadrao(cleanText, voiceLang));
    }
}

// onAudioIniciado (opcional): chamado no instante em que a reprodução
// realmente começa (depois de qualquer busca/geração) - permite quem chamou
// mostrar um indicador de "gerando áudio..." só durante a espera de rede,
// sem precisar duplicar a lógica de busca em cada tela (útil sobretudo pro
// limitado, que não pré-carrega o verso do flashcard - ver Flashcards.jsx -
// então a geração acontece na hora do flip, de forma perceptível).
export const playAudio = async (text, user, ia = false, lang = null, forcarVozPadrao = false, velocidadeNormal = false, onAudioIniciado = null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    if (!text) return;

    // Dica "dá pra mudar a velocidade em Configurações" na primeira vez que o
    // usuário ouve um áudio de verdade (treino, perguntas, frases por IA).
    // velocidadeNormal=true identifica o jogo Chuva de Frases (único chamador
    // que usa esse parâmetro) - lá o áudio é sempre no tom normal de
    // propósito, então a dica de velocidade não faz sentido nesse contexto.
    if (!velocidadeNormal) {
        dispatchPrimeiroAudio(user);
    }

    const voiceLang = lang || user?.learning_language;

    const myToken = cancelarAudioAtual();

    // Voz natural (ElevenLabs): liberada pro plano premium (1, limite diário)
    // e, como amostra grátis, pro plano limitado (3, limite vitalício) -
    // ambos controlados pelo backend. Se der erro genérico (rede, API fora),
    // cai pra voz padrão abaixo. Mas se o motivo for limite atingido, não
    // reproduz nada - só mostra o modal premium.
    // forcarVozPadrao ignora o plano e usa sempre a voz gratuita (ex: frente
    // do flashcard em DigitarTexto.jsx, que não deve gastar cota de voz premium).
    if (!forcarVozPadrao && !cotaNaturalEsgotada(user) && !limiteReproducoesLimitadoAtingido(user) && (user.plano === 1 || user.plano === 3)) {
        // Reserva o slot ANTES do fetch (que é assíncrono) - contar só depois
        // de buscar o áudio permitia que múltiplas chamadas simultâneas (ex:
        // acertar vários pares rápido em Emparelhar.jsx, ou tocar frases
        // diferentes em sequência rápida em Frases.jsx) todas enxergassem a
        // MESMA contagem ainda não incrementada e passassem juntas, furando
        // o teto de 10 em paralelo. Reservar aqui é conservador (uma
        // tentativa que falha depois ainda consome o slot), mas nunca deixa
        // passar do limite - a prioridade é o teto ser confiável.
        if (user.plano === 3 && registrarReproducaoNaturalLimitado(user)) {
            marcarCotaNaturalEsgotada(user);
            avisarLimiteAudioSeNecessario(user);
        }

        const chaveNatural = chaveCacheAudio("natural", voiceLang, text);
        const resultado = await obterOuBuscarAudio(chaveNatural, () => gerarAudio(text));

        // A URL do blob é de uso único (revogada depois de tocar) - tira do
        // cache assim que consumida, senão um replay reusaria uma URL já
        // revogada e o áudio falharia em silêncio. Uma próxima reprodução
        // busca de novo (sem cache, como antes do preload existir).
        if (resultado?.url) {
            cacheAudio.delete(chaveNatural);
        }

        if (resultado?.limiteAtingido) {
            // Marca ANTES de qualquer coisa - a partir daqui, nenhuma outra
            // frase (mesmo já pré-carregada com sucesso antes do limite
            // acabar) volta a tentar voz natural nesta sessão/dia.
            marcarCotaNaturalEsgotada(user);

            if (avisarLimiteAudioSeNecessario(user)) {
                return;
            }
            // Modal já foi exibido antes - segue pro fallback de voz padrão abaixo.
        } else if (resultado?.url) {
            // uma chamada mais recente já assumiu o controle enquanto aguardávamos o áudio
            if (myToken !== currentToken) {
                URL.revokeObjectURL(resultado.url);
                return;
            }

            const audio = new Audio(resultado.url);
            currentAudio = audio;

            audio.playbackRate = velocidadeNormal ? 1.0 : 0.9;
            onAudioIniciado?.();

            // Espera o áudio terminar de verdade antes de resolver - quem
            // chama (ex: jogo Chuva de Frases) precisa saber quando a
            // reprodução acabou pra prosseguir só depois disso.
            await new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(resultado.url);
                    currentAudio = null;
                    resolve();
                };
                audio.onerror = () => {
                    currentAudio = null;
                    resolve();
                };
                audio.play().catch(() => resolve());
            });

            return;
        }
    }

    try {
        const cleanText = text.trim().replace(/^"|"$/g, '');
        const chavePadrao = chaveCacheAudio("padrao", voiceLang, cleanText);
        const audios = await obterOuBuscarAudio(chavePadrao, () => buscarAudiosPadrao(cleanText, voiceLang));

        // uma chamada mais recente já assumiu o controle enquanto buscávamos o áudio
        if (myToken !== currentToken) return;

        // controle de execução
        currentAudio = { playing: true };
        onAudioIniciado?.();

        for (const base64 of audios) {

            // se cancelado por uma chamada mais recente
            if (myToken !== currentToken || !currentAudio || currentAudio.playing !== true) break;

            const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const blob = new Blob([byteArray], { type: "audio/mpeg" });
            const urlAudio = URL.createObjectURL(blob);

            const audio = new Audio(urlAudio);
            currentAudio = audio;

            // A voz padrão (LibreTranslate) não tem parâmetro de velocidade
            // na API, então aplicamos no player - disponível em qualquer
            // plano, diferente da escolha de voz (só premium). velocidadeNormal
            // ignora a preferência salva (ex: acerto no jogo Chuva de Frases,
            // que sempre toca no tom normal pra não atrapalhar o reforço).
            const velocidadePreferida = parseFloat(localStorage.getItem('zaldemy_velocidade_tts'));
            audio.playbackRate = velocidadeNormal
                ? 1.0
                : (Number.isFinite(velocidadePreferida) ? velocidadePreferida : 1.0);

            await audio.play().catch(err => {
                console.error("ERRO PLAY:", err);
            });

            await new Promise(resolve => {
                audio.onended = resolve;
                audio.onerror = resolve;
            });

            URL.revokeObjectURL(urlAudio);
        }

        if (myToken === currentToken) {
            currentAudio = null;
        }

    } catch (err) {
        console.error("Erro ao tocar áudio:", err);
        if (myToken === currentToken) {
            currentAudio = null;
        }
    }
};

// Retorna { limiteAtingido: true }, { url } ou null (erro genérico - cai
// pro fallback de voz padrão).
const gerarAudio = async (texto) => {
    const API_URL = import.meta.env.VITE_API_URL;

    try {
        // GET (não POST) de propósito - permite o service worker cachear a
        // resposta por URL (ver vite.config.js, cache "tts-cache-natural"),
        // pra um replay da mesma frase não gerar áudio (nem cobrar cota) de
        // novo. Com POST o texto ficaria só no corpo, fora da URL, e não
        // dava pra cachear.
        const url =
            `${API_URL}/controller/tts.php?action=stream_audio` +
            "&texto=" + encodeURIComponent(texto);

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        if (!res.ok) {
            throw new Error("Erro HTTP: " + res.status);
        }

        const contentType = res.headers.get("content-type");

        if (!contentType || !contentType.includes("audio")) {
            const text = await res.text();
            console.error("Resposta não é áudio:", text);

            try {
                const data = JSON.parse(text);
                if (data.limite_atingido) {
                    return { limiteAtingido: true };
                }
            } catch {
                // resposta não era JSON - segue pro fallback normal abaixo
            }

            throw new Error("API não retornou áudio");
        }

        const blob = await res.blob();

        if (blob.size === 0) {
            throw new Error("Áudio vazio");
        }

        return { url: URL.createObjectURL(blob) };

    } catch (err) {
        console.error("Erro ao gerar áudio:", err);
        return null;
    }
};
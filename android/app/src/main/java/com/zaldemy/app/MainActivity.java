package com.zaldemy.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Habilita inspeção remota da WebView via chrome://inspect (cabo
        // USB) - builds de release não ligam isso por padrão, o que
        // impedia debugar ao vivo bugs que só acontecem no celular real
        // (ex: investigação do áudio não interrompendo em Flashcards).
        // TODO: reconsiderar antes de uma base de usuários grande -
        // qualquer app instalado com depuração USB ativada no aparelho
        // consegue inspecionar esse WebView.
        WebView.setWebContentsDebuggingEnabled(true);
    }
}

// E-mails com acesso ao dashboard administrativo e ao login pelo computador.
export const ADMIN_EMAILS = ['marciosunico18@gmail.com'];

export function isAdminEmail(email) {
    return ADMIN_EMAILS.includes((email || '').trim().toLowerCase());
}

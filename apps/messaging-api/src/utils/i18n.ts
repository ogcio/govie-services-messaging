import { httpErrors } from "@fastify/sensible";
import Polyglot from "node-polyglot";
import type { AvailableLanguages } from "../types/schemaDefinitions.js";

type Translations = {
  en: {
    secureMessageSubject: string;
    secureMessageHtml: string;
    secureMessageText: string;
    secureMessageExcerpt: string;
  };
  ga: {
    secureMessageSubject: string;
    secureMessageHtml: string;
    secureMessageText: string;
    secureMessageExcerpt: string;
  };
};

type TranslationKey<T extends keyof Translations> = keyof Translations[T];

const translations: Translations = {
  en: {
    secureMessageSubject:
      "You have received a new secure message from %{organizationName}",
    secureMessageHtml: `
      <p>Dear %{publicName},</p>
      <p>A new secure message has been sent to your Messaging mailbox from %{organizationName}.</p>
      <p>Please log in to <a href="%{showMessageUrl}">view your message</a>. Note that you must have a verified <a href="https://mygovid.ie">MyGovId</a> account to access the message.</p>
      <p>Best regards,</p>
      <p>The Gov.ie Messaging Team</p>
      <p><i>This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. If you have received this email in error please notify Messaging Support.</i></p>
    `,
    secureMessageText: `Dear %{publicName}
A new secure message has been sent to your Messaging mailbox from %{organizationName}.
Please log in to [view your message][1]. Note that you must have a verified [MyGovId][2] account to access the message.
Best regards
The Gov.ie Messaging Team

This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. If you have received this email in error please notify Messaging Support.

[1]: %{showMessageUrl}
[2]: https://mygovid.ie
`,
    secureMessageExcerpt:
      "You have received a new secure message from %{organizationName}",
  },
  ga: {
    secureMessageSubject:
      "Tá teachtaireacht shlán nua faighte agat ó %{organizationName}",
    secureMessageHtml: `
      <p>A chara %{publicName},</p>
      <p>Tá teachtaireacht shlán nua seolta chuig do bhosca ríomhphoist Messaging ó %{organizationName}.</p>
      <p>Logáil isteach le do thoil chun <a href="%{showMessageUrl}">do theachtaireacht a fheiceáil</a>. Tabhair faoi deara go gcaithfidh cuntas deimhnithe <a href="https://mygovid.ie">MyGovId</a> a bheith agat chun rochtain a fháil ar an teachtaireacht.</p>
      <p>Le dea-ghuí,</p>
      <p>Foireann Messaging Gov.ie</p>
      <p><i>Tá an ríomhphost seo agus aon chomhaid a sheoltar leis faoi rún agus ceaptha don duine aonair nó don eintiteas dá bhfuil siad dírithe amháin. Má fuair tú an ríomhphost seo trí earráid, cuir é sin in iúl do Thacaíocht Messaging le do thoil.</i></p>
    `,
    secureMessageText: `A chara %{publicName},
Tá teachtaireacht shlán nua seolta chuig do bhosca ríomhphoist Messaging ó %{organizationName}.
Logáil isteach le do thoil chun [do theachtaireacht a fheiceáil][1]. Tabhair faoi deara go gcaithfidh cuntas deimhnithe [MyGovId][2] a bheith agat chun rochtain a fháil ar an teachtaireacht.
Le dea-ghuí,
Foireann Messaging Gov.ie

Tá an ríomhphost seo agus aon chomhaid a sheoltar leis faoi rún agus ceaptha don duine aonair nó don eintiteas dá bhfuil siad dírithe amháin. Má fuair tú an ríomhphost seo trí earráid, cuir é sin in iúl do Thacaíocht Messaging le do thoil.

[1]: %{showMessageUrl}
[2]: https://mygovid.ie
`,
    secureMessageExcerpt:
      "Tá teachtaireacht shlán nua faighte agat ó %{organizationName}",
  },
};

export interface I18n {
  translate: <T extends keyof Translations>(
    language: T,
    translationName: TranslationKey<T>,
    variables?: Record<string, string>,
  ) => string;
}

declare module "fastify" {
  export interface FastifyInstance {
    i18n: I18n;
  }
}

function getDefaultPolyglots(): Record<AvailableLanguages, Polyglot> {
  return {
    en: new Polyglot({ phrases: translations.en }),
    ga: new Polyglot({ phrases: translations.ga }),
  };
}

export class Translator implements I18n {
  private readonly polyglots: Record<AvailableLanguages, Polyglot>;
  constructor(inputPolyglots?: Record<AvailableLanguages, Polyglot>) {
    this.polyglots = inputPolyglots ?? getDefaultPolyglots();
  }
  translate<T extends keyof Translations>(
    language: T,
    translationName: TranslationKey<T>,
    variables: Record<string, string> = {},
  ): string {
    const polyglot = this.polyglots[language];
    if (!polyglot) {
      throw httpErrors.badRequest(`Unsupported language: ${language}`);
    }
    return polyglot.t(translationName as string, variables);
  }
}

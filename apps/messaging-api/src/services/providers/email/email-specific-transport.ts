import { createTransport, type Transporter } from "nodemailer";
import type { MessageToDeliver } from "../../../types/messages.js";
import type { EmailProvider } from "../../../types/providers.js";
import {
  type MessagingEventLogger,
  MessagingEventType,
} from "../../messages/event-logger.js";
import type { SpecificTransport } from "../transport-factory.js";

export class EmailSpecificTransport
  implements SpecificTransport<EmailProvider>
{
  readonly provider: EmailProvider;
  private nodeMailerTransporter: Transporter | undefined;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async sendMessage(params: {
    message: MessageToDeliver;
    recipientAddress: string;
  }) {
    const { recipientAddress, message } = params;
    const transporter = await this.getNodemailerTransporter();

    await transporter.sendMail({
      from: `${this.provider.providerName} <${this.provider.fromAddress}>`,
      to: recipientAddress,
      subject: message.subject,
      text: message.body,
      html: message.richText,
    });
  }

  private async getNodemailerTransporter(): Promise<Transporter> {
    if (this.nodeMailerTransporter) {
      return this.nodeMailerTransporter;
    }

    this.nodeMailerTransporter = createTransport({
      host: this.provider.smtpHost,
      port: this.provider.smtpPort,
      secure: this.provider.ssl,
      auth: {
        user: this.provider.username,
        pass: this.provider.password,
      },
    });

    return this.nodeMailerTransporter;
  }

  async checkIfMessageCanBeSent(params: {
    eventLogger: MessagingEventLogger;
    message: MessageToDeliver;
    userAddress: string | null | undefined;
  }): Promise<boolean> {
    const { eventLogger, message, userAddress } = params;
    if (!userAddress || userAddress.trim().length === 0) {
      eventLogger.log(MessagingEventType.emailError, {
        messageId: message.id,
        messageKey: "noEmail",
      });
      return false;
    }
    if (!message.subject || message.subject.trim().length === 0) {
      eventLogger.log(MessagingEventType.emailError, {
        messageId: message.id,
        messageKey: "noSubject",
      });
      return false;
    }

    return true;
  }
}

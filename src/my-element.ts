/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { Message } from '@aws-sdk/client-bedrock-runtime/dist-types/models';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';
import { choose } from 'lit/directives/choose.js';

import { ModelClient } from './model-client';
import { AgentClient } from './agent-client';

import { userIcon, assistantIcon } from './assetPaths.js';

import DOMPurify from 'dompurify';
import { marked } from "marked";
import { awsCredentialsForAnonymousUser, awsCredentialsForAuthCognitoUser } from "./authentication";

export const defaultOptions = {

}

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('br-chat')
export class MyElement extends LitElement {
  @property({
    type: Object,
    converter: (value: any) => ({ ...defaultOptions, ...JSON.parse(value ?? '{}') }),
  })
  config: any = undefined;

  @property()
  private prompt: string = '';

  @property({ type: Array })
  messages: Message[] = [];

  @state()
  protected isLoading: boolean = false;

  private _bedrockClient: AgentClient | ModelClient | undefined;

  protected reunderWebExperience() {
    return html`
      <div class="web-experience">
        <div class="header">
          <div class="title">${this.config.ui.webExperience.title}</div>
          <div class="subtitle">${this.config.ui.webExperience.subtitle}</div>
        </div>
        <div class="welcomeMessage">
          <div class="messages">
            ${this.renderMessage({
      role: "assistant",
      content: [{ text: this.config.ui.webExperience.welcomeMessage }]
    })}
          </div>
        </div>
      </div>
    `;
  }

  protected renderMessageIcon(role: string) {
    if (role === 'assistant') {
      if (this.config.ui?.icons?.assistant) {
        return html`<img class="avatar" src="${this.config.ui.icons.assistant}" />`
      }
      return html`${assistantIcon}`;
    } else if (role === 'user') {
      if (this.config.ui?.icons?.user)
        return html`<img class="avatar" src="${this.config.ui.icons.user}" />`
      return html`${userIcon}`;
    }
  }

  protected renderMessage(message: Message) {
    const htmlContent = marked.parse(message.content[0].text);
    const sanitizedHtml = DOMPurify.sanitize(htmlContent);

    return html`
        <div class="message ${message.role}">
          <!-- <img lass="avatar" src=${userIcon} /> -->
           ${this.renderMessageIcon(message.role)}
          <!-- ${choose(message.role, [
      ['user', () => html`${userIcon}`],
      ['assistant', () => html`${assistantIcon}`]
    ])} -->
          <div class="body-response" >
            <div class="text" >
              ${unsafeHTML(sanitizedHtml)}
           </div>
        </div>
      </div>`;
  }

  protected renderPromptInput() {
    return html`
    <div class="prompt-container">
        <div class="prompt">
        <form>
            <textarea 
              placeholder="How can I help you today?"
              .value=${this.prompt}
              @input=${this.handlePromptInput}
              required
              @keydown=${this.onPromptKeyDown}
              >
            </textarea>
            <div class="button">
              <button type="button" @click=${async () => this.onSendPromptClicked()}>
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAzNCAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzUzOF83NzIxMykiPgo8cGF0aCBkPSJNMzEuMTEyOSAxNi45NzA2SDE1LjU1NjUiIHN0cm9rZT0iIzk4QTJCMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTMxLjExMjggMTYuOTcwNkwxMi4wMjEgMjYuMTYzTDE1LjU1NjUgMTYuOTcwNkwxMi4wMjEgNy43NzgxOEwzMS4xMTI4IDE2Ljk3MDZaIiBzdHJva2U9IiM5OEEyQjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDBfNTM4Xzc3MjEzIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYuOTcwNykgcm90YXRlKDQ1KSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPg==" alt="submit">
              </button>
            </div>
        </form>
        </div>
    </div>`;
  }

  override render() {
    return html`
      <div class="chat-container">
        ${when(this.messages.length > 0, () => html`
          <div class="messages">
            ${repeat(this.messages, (message) => this.renderMessage(message))}
          </div>
        `)}
        ${when(this.messages.length <= 0 && this.config.ui.webExperience, () => html`${this.reunderWebExperience()}`)}
        ${this.renderPromptInput()}
      </div>
    `;
  }

  async handlePromptInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.prompt = target.value;
    this.adjustTextareaHeight(target);

  }
  async onSendPromptClicked() {
    if (this.prompt) {
      await this.sendMessage(this.prompt);
      this.prompt = '';
      // TODO: Make textarea a property of the component?
      // this.handlePromptInput();
    }
  }

  async onPromptKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.onSendPromptClicked();
    }
  }

  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('config')) {
      this.init();
      // this.onMessagesChanged();
    }
  }

  private async init() {
    if (!this.config) {
      return;
    }

    let credentials;
    try {
      if (this.config.auth.anonymous) {
        credentials = await awsCredentialsForAnonymousUser(this.config.auth);
      } else if (this.config.auth.cognito) {
        credentials = await awsCredentialsForAuthCognitoUser(this.config.auth);
      } else {
        throw new Error("There is an error with your credentials. Check if you put a valid role");
      }
      if (this.config.bedrock.agent) {
        this._bedrockClient = new AgentClient(this.config, credentials);
      } else if (this.config.bedrock.modelId) {
        this._bedrockClient = new ModelClient(this.config, credentials);
      }
    } catch (error) {
      console.error(error);
    }
  }

  addMessage(message: Message) {
    this.messages = [...this.messages, message];
  }

  private adjustTextareaHeight(textarea: HTMLTextAreaElement) {

    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }


  private async sendMessage(prompt: string) {
    // this.setLoading(true);
    this.isLoading = true;
    const message: Message = {
      role: "user",
      content: [{ text: prompt }]
    };
    this.addMessage(message);

    try {
      const completionStreamIterator = this._bedrockClient?.sendMessage(this.messages);

      const { messages } = this;

      const responseMessage: Message = {
        role: "assistant",
        content: [{ text: '' }]
      };

      for await (const chunk of completionStreamIterator) {
        responseMessage.content[0].text += chunk;
        this.messages = [...messages, responseMessage];
      }

    } catch (err) {
      console.error(err);
      this.isLoading = false;
    }

    this.isLoading = false;
  }

  static override styles = css`
    :host {
      --primary: var(--brc-primary, #141f2e);
      --bg: var(--brc-bg, #fcfcfd);
      --text-color: var(--brc-text-color, #000);
      --text-invert-color: var(--brc--text-invert-color, #fff);

      /* --submit-button-color: var(--brc-submit-button-color, var(--primary)); */
    
      --submit-button-border: var(--brc-submit-button-border, none);
      --submit-button-bg: var(--brc-submit-button-bg, none);
      --submit-button-bg-hover: var(--brc-submit-button-bg-hover, #f0f0f0);

      --prompt-input-bg-color: var(--brc-prompt-input-bg-color, #fff);
      --prompt-input-text-color: var(--brc-prompt-input-text-color, var(--text-color));
      --prompt-input-border-color: var(--brc-prompt-input-border-color, #53b1fd);
      /* --input-font-size: var(--brc-input-font-size, 16px); */

      /* --user-chat-bg-color: var(--brc-user-chat-bg-color, #f0f0f0);
      --user-chat-border-color: var(--brc-user-chat-border-color, #f0f0f0); */
      --user-chat-text-color: var(--brc-user-chat-text-color, var(--text-color));

      --assistant-chat-bg-color: var(--brc-assistant-chat-bg-color, #fff);
      --assistant-chat-border-color: var(--brc-assistant-chat-border-color, #d0d5dd);
      --assistant-chat-text-color: var(--brc-assistant-chat-text-color, var(--text-color));
    }

    .chat-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: var(--bg);
      position: relative;

      .web-experience {
        /* position: absolute; */
        height: 90%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 4em 0;

        & .header {
          text-align: center;

          & .title {
              font-size: 36px;
              font-weight: 700;
              line-height: 64px;
              color: #383c43;
          }

          & .subtitle {
              color: #667085;
              font-size: 18px;
              font-weight: 600;
              padding-bottom: 32px;
          }
        }
      }

      pre {
        font-family: inherit;
        font-size: inherit;
        margin: 0;
        white-space: inherit;
      }

      & .messages {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        gap: 24px;
        overflow-x: hidden;
        overflow-y: auto;
        width: 100%;
        padding-bottom: 4px;
        padding-top: 12px;

        & .message {
          display: flex;
          flex-direction: row;
          gap: 17px;
          margin: 0;
          padding: 0 10px;
          height: auto;
          max-width: 100%;

          & .avatar {
            margin-bottom: auto;
            overflow: clip;
            width: 41px;
            height: auto;
          }

          & .body-response {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 8px;
            margin-left: 6px;

            & .text {
              display: flex;
              flex: 1;
              flex-direction: column;
              word-break: break-word;
              font-style: normal;

              p {
                margin: 0 0 8px;
              }
            }
          }
        }
      }

      & .user {
        align-items: flex-start;

        font-size: 16px;
        font-weight: 500;
        gap: 17px;
        line-height: 160%;
        margin-bottom: 32px;
        color: var(--user-chat-text-color);

        & .body-response {
          & .text {
            margin: 10px 0 0;
          }
        }
      }

      & .assistant {
        margin: 0;
        margin-bottom: 24px;

        & .body-response {

          background-color: var(--assistant-chat-bg-color);
          border: 0.5px solid var(--assistant-chat-border-color);
          color: var(--assistant-chat-text-color);
          border-radius: 12px;
          /* box-shadow: 0 1px 2px 0 rgba(16, 24, 40, .06), 0 1px 3px 0 rgba(16, 24, 40, .1); */

          & .text {
              padding: 24px;
          }
        }
      }

      & .prompt-container {
        align-self: stretch;
        display: flex;
        flex-direction: row-reverse;
        font-family: inherit;
        font-weight: 400;
        gap: 17px;
        justify-content: center;
        line-height: 160%;
        margin: 0 auto;
        padding-top: 12px;
        width: 100%;

        & .prompt {
          display: flex;
          flex-direction: column;
          width: 100%;

          & form {
            align-items: center;
            background-color: var(--prompt-input-bg-color);
            border: solid 1px var(--prompt-input-border-color);
            border-radius: 8px;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            gap: 8px;
            height: auto;
            margin: 0;
            max-height: 350px;
            min-height: 48px;
            padding: 6px 6px 6px 12px;
            color: var(--prompt-input-text-color);

            & textarea {
              align-items: flex-start;
              border: none;
              display: flex;
              flex-direction: column;
              flex-grow: 1;
              font-family: inherit;
              font-size: var(--input-font-size);
              font-weight: 400;
              order: 1;
              outline: none;
              overflow-y: auto;
              padding: 0;
              resize: none;
              width: 100%;
              line-height: 1.5em;
              min-height: 1.5em;
              max-height: 4.5em;
              height: 0px;
              white-space: pre-wrap;
              background-color: inherit;
              color: var(--prompt-input-text-color);
            }

            & textarea:placeholder-shown {
              font-style: italic;
            }

            & .button {
              align-items: baseline;
              background-color: transparent;
              border: transparent;
              display: flex;
              gap: 16px;
              justify-content: flex-end;
              margin: auto 0 0;
              order: 2;
              padding: 0;

              & button {
               background-color: var(--submit-button-bg);
                border: solid 1px var(--submit-button-border);
                color: var(--submit-button-color);
                border-radius: 4px;
                 cursor: pointer;
                transition: background-color 100ms linear;

                align-items: center;
                border-radius: 4px;
                box-sizing: border-box;
                display: flex;
                flex-direction: row;
                font-family: inherit;
                font-size: 16px;
                font-style: normal;
                font-weight: 500;
                gap: 8px;
                line-height: 157%;
                padding: 0 5px 0 0;
                text-decoration: none;

                &:hover {
                  background-color: var(--submit-button-bg-hover);
                }
              }
            }
          }

          form:has(textarea:focus) {
            border: 1px solid var(--gray-450, #6b727e);
          }
        }
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'br-chat': MyElement;
  }
}

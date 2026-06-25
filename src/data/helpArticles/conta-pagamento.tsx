import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const contaPagamentoArticles: HelpArticle[] = [
  {
    slug: "segunda-via-boleto",
    title: "Como acessar e pagar a 2ª via do boleto",
    description:
      "Três formas de obter sua fatura: portal, app e WhatsApp.",
    keywords: ["2ª via", "segunda via", "boleto", "fatura"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <h2 id="portal">Pelo Portal do Cliente</h2>
        <ol>
          <li>Acesse <a href="https://jotazo.rbxsoft.com" target="_blank" rel="noreferrer">jotazo.rbxsoft.com</a>;</li>
          <li>Faça login com CPF/CNPJ e senha;</li>
          <li>Clique em <strong>Faturas → 2ª via</strong>;</li>
          <li>Baixe em PDF, copie o código de barras ou pague via Pix.</li>
        </ol>

        <h2 id="app">Pelo App Jotazo</h2>
        <p>
          Na tela inicial, toque em <strong>"Pagar Fatura"</strong>. O app mostra o valor
          atualizado e gera Pix instantâneo.
        </p>

        <h2 id="whatsapp">Pelo WhatsApp</h2>
        <p>
          Envie a palavra <strong>"boleto"</strong> para o nosso WhatsApp <a href="https://wa.me/5511920047488">(11)
          92004-7488</a>. O atendimento automático envia sua 2ª via em segundos.
        </p>

        <HelpCallout variant="tip">
          Pix é creditado em poucos minutos. Boletos pagos no banco podem demorar até 3 dias úteis
          para baixar.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "conta-pagamento", articleSlug: "metodos-pagamento" },
      { categorySlug: "conta-pagamento", articleSlug: "debito-automatico" },
    ],
  },
  {
    slug: "metodos-pagamento",
    title: "Métodos de pagamento aceitos",
    description:
      "Todas as opções para pagar sua mensalidade Jotazo com segurança e praticidade.",
    keywords: ["pagamento", "pix", "cartão", "boleto"],
    updatedAt: UPDATED,
    body: (
      <>
        <ul>
          <li><strong>Pix</strong> — instantâneo, sem custo adicional. Disponível 24/7.</li>
          <li><strong>Boleto bancário</strong> — pagável em qualquer banco, lotérica ou app bancário.</li>
          <li><strong>Débito automático</strong> — desconto na conta na data do vencimento.</li>
          <li><strong>Cartão de crédito recorrente</strong> — Visa, Mastercard, Elo, Hipercard.</li>
          <li><strong>PicPay e Mercado Pago</strong> — via leitura do código de barras.</li>
        </ul>

        <HelpCallout variant="info">
          Não cobramos taxa de boleto. O valor da fatura é exatamente o valor do plano contratado.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "trocar-vencimento",
    title: "Como trocar a data de vencimento",
    description:
      "Escolha a melhor data para o seu fluxo de caixa em poucos cliques.",
    keywords: ["vencimento", "data", "alterar"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          Você pode escolher entre as datas de vencimento disponíveis (geralmente dias 5, 10, 15,
          20 e 25). A alteração só pode ser feita uma vez a cada 6 meses.
        </p>

        <h2 id="como">Como trocar</h2>
        <ol>
          <li>Acesse o Portal do Cliente;</li>
          <li>Vá em <strong>Minha Conta → Vencimento</strong>;</li>
          <li>Escolha a nova data e confirme.</li>
        </ol>

        <HelpCallout variant="warning" title="Atenção ao primeiro mês">
          A primeira fatura após a mudança pode vir com valor proporcional aos dias adicionais ou
          ter desconto pelos dias a menos.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "debito-automatico",
    title: "Como cadastrar débito automático",
    description:
      "Pague em dia, sem precisar lembrar do vencimento.",
    keywords: ["débito automático", "cartão recorrente"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="cartao">Pelo cartão de crédito</h2>
        <ol>
          <li>Acesse o Portal → <strong>Pagamento → Cartão recorrente</strong>;</li>
          <li>Cadastre os dados do cartão (transação segura, dados criptografados);</li>
          <li>A cobrança passa a ser feita automaticamente todo mês na data de vencimento.</li>
        </ol>

        <h2 id="conta">Pela conta bancária</h2>
        <ol>
          <li>Acesse o app do seu banco;</li>
          <li>Vá em "Débito Automático" e busque por <strong>Jotazo Telecom</strong>;</li>
          <li>Informe o seu CPF/CNPJ e código de cliente (disponível no rodapé do boleto).</li>
        </ol>

        <HelpCallout variant="success">
          Clientes em débito automático recebem 5% de desconto em adicionais de pacotes.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "suspensao-religacao",
    title: "Suspensão por inadimplência: prazos e religação",
    description:
      "Como funciona a suspensão de serviço e como religar tudo após o pagamento.",
    keywords: ["suspensão", "inadimplência", "religação", "atraso"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="prazos">Prazos</h2>
        <ul>
          <li><strong>Aviso prévio:</strong> 7 dias antes da suspensão (SMS, e-mail, WhatsApp);</li>
          <li><strong>Suspensão parcial</strong> (apenas saída de internet bloqueada): 30 dias após vencimento;</li>
          <li><strong>Suspensão total</strong>: 75 dias após vencimento;</li>
          <li><strong>Negativação</strong> em birôs de crédito: a partir de 90 dias.</li>
        </ul>

        <h2 id="religar">Como religar</h2>
        <p>
          Após o pagamento via Pix, a religação é automática em <strong>até 30 minutos</strong>.
          Para boletos pagos no banco, pode levar até 3 dias úteis (compensação).
        </p>

        <HelpCallout variant="tip" title="Pague pelo Pix para acelerar">
          O Pix é a forma mais rápida de religação. Use o QR code ou o "copia e cola" da fatura.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "contestar-cobranca",
    title: "Como contestar uma cobrança",
    description:
      "Se um valor parece errado, você tem direito de contestar em até 90 dias.",
    keywords: ["contestar", "cobrança indevida", "reembolso"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          Conforme a Resolução Anatel 632/2014, você tem até <strong>90 dias do vencimento</strong>
          para contestar qualquer valor.
        </p>

        <h2 id="passos">Como contestar</h2>
        <ol>
          <li>Abra um chamado pelo nosso atendimento informando o valor e o motivo;</li>
          <li>Anote o número de protocolo;</li>
          <li>Resposta em até 30 dias corridos;</li>
          <li>Se reconhecida a cobrança indevida, o valor é estornado em até 7 dias.</li>
        </ol>

        <HelpCallout variant="info" title="Pode pagar contestando?">
          Sim. O pagamento durante a contestação não significa concordância. Você pode pagar para
          evitar suspensão e aguardar a análise.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "nota-fiscal",
    title: "Nota fiscal eletrônica: onde baixar",
    description:
      "Acesse o XML e DANFE da sua NFSC para fins contábeis.",
    keywords: ["nota fiscal", "nfsc", "xml", "danfe"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A Nota Fiscal de Serviço de Comunicação (NFSC) modelo 21 é gerada todo mês,
          automaticamente, junto com a fatura.
        </p>

        <h2 id="onde">Onde acessar</h2>
        <ol>
          <li>Portal do Cliente → <strong>Faturas → Nota Fiscal</strong>;</li>
          <li>Disponível em PDF (DANFE) e XML;</li>
          <li>Histórico de 5 anos disponível para download.</li>
        </ol>

        <HelpCallout variant="tip">
          Para empresas, recomendamos cadastrar e-mail do contador no Portal para envio
          automático mensal.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "mudanca-titularidade",
    title: "Mudança de titularidade",
    description:
      "Como transferir o contrato para outra pessoa do mesmo endereço.",
    keywords: ["titularidade", "transferir", "mudar titular"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A titularidade pode ser transferida sem custo, desde que o novo titular passe na
          análise de crédito e o atual esteja em dia.
        </p>

        <h2 id="documentos">Documentos necessários</h2>
        <ul>
          <li>RG/CPF dos dois titulares;</li>
          <li>Comprovante de endereço do imóvel;</li>
          <li>Termo de cessão assinado (enviado por nós).</li>
        </ul>

        <h2 id="prazo">Prazo</h2>
        <p>
          Em até <strong>5 dias úteis</strong> após o recebimento dos documentos. O atual titular
          recebe a fatura final proporcional e o novo titular passa a receber a próxima.
        </p>
      </>
    ),
  },
];

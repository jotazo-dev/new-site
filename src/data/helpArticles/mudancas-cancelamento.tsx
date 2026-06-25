import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const mudancasCancelamentoArticles: HelpArticle[] = [
  {
    slug: "mudanca-endereco",
    title: "Mudança de endereço: como pedir e prazos",
    description:
      "Levar a Jotazo para a casa nova é simples — desde que tenha cobertura.",
    keywords: ["mudança", "endereço", "transferência"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <h2 id="processo">Processo</h2>
        <ol>
          <li>Verifique se o novo endereço tem cobertura em <a href="/cobertura">cobertura</a>;</li>
          <li>Solicite a mudança pelo WhatsApp ou Portal com no mínimo <strong>10 dias de antecedência</strong>;</li>
          <li>Agendamos a desativação no endereço atual e a instalação no novo;</li>
          <li>O equipamento é levado pelo técnico ou retirado pelo cliente.</li>
        </ol>

        <h2 id="custo">Custo</h2>
        <p>
          Para clientes ativos há mais de 12 meses, a mudança é <strong>gratuita</strong>.
          Para os demais, há uma taxa simbólica de instalação (R$ 99) que pode ser parcelada.
        </p>

        <HelpCallout variant="warning" title="Sem cobertura no novo endereço">
          Se não tivermos cobertura, você pode cancelar sem multa de fidelidade, desde que envie
          comprovante de residência do novo endereço.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "upgrade-downgrade",
    title: "Como fazer upgrade ou downgrade de plano",
    description:
      "Mudar de velocidade é instantâneo. Veja como e quando vale a pena.",
    keywords: ["upgrade", "downgrade", "trocar plano"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="upgrade">Upgrade</h2>
        <p>
          Solicite pelo Portal, app ou WhatsApp. A nova velocidade é ativada em até 24 horas
          (geralmente em minutos). A diferença proporcional é cobrada na próxima fatura.
        </p>

        <h2 id="downgrade">Downgrade</h2>
        <p>
          Disponível para planos sem fidelidade ou após o término do período de fidelização.
          Solicite com 10 dias de antecedência ao próximo vencimento.
        </p>

        <HelpCallout variant="tip">
          Antes do downgrade, verifique se o novo plano atende sua casa: streaming 4K + jogos
          online + home office demandam ao menos 200 Mbps.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "adicionar-tv-movel",
    title: "Adicionar TV ou móvel ao seu plano (combo)",
    description:
      "Combinar serviços rende desconto e simplifica seu boleto.",
    keywords: ["combo", "adicionar tv", "adicionar móvel"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          Combos são planos convergentes onde você economiza ao agrupar internet, TV e móvel em
          uma só fatura.
        </p>

        <h2 id="como">Como adicionar</h2>
        <ol>
          <li>Acesse <a href="/monte-seu-combo">Monte seu Combo</a>;</li>
          <li>Selecione os serviços desejados;</li>
          <li>O desconto é aplicado automaticamente;</li>
          <li>Confirme. Se for adicionar TV, agendamos visita técnica em até 5 dias úteis.</li>
        </ol>

        <HelpCallout variant="info">
          O móvel 5G pode ser adicionado sem visita técnica. O chip é entregue por correio em até
          7 dias úteis.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "fidelidade",
    title: "Fidelidade: como funciona e cálculo de multa",
    description:
      "Entenda o período de fidelização e como é calculada a multa proporcional.",
    keywords: ["fidelidade", "multa", "fidelização"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="quando">Quando há fidelidade</h2>
        <p>
          A fidelidade é aplicada quando há <strong>subsídio</strong>: instalação grátis,
          equipamento mais avançado, primeiro mês promocional ou desconto agressivo. Conforme
          Anatel, o prazo máximo é <strong>12 meses</strong>.
        </p>

        <h2 id="multa">Cálculo da multa</h2>
        <p>
          A multa é <strong>proporcional ao tempo restante</strong>. Fórmula:
        </p>
        <p>
          <code>multa = (valor total do desconto recebido) × (meses restantes / 12)</code>
        </p>
        <p>
          Exemplo: R$ 600 de desconto distribuído por 12 meses, cancelando no 8º mês = R$ 200 de
          multa.
        </p>

        <HelpCallout variant="success" title="Quando NÃO há multa">
          <ul>
            <li>Cancelamento por descumprimento contratual nosso (queda recorrente, qualidade ruim);</li>
            <li>Mudança para área sem cobertura;</li>
            <li>Falecimento do titular;</li>
            <li>Após o término dos 12 meses.</li>
          </ul>
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "cancelamento",
    title: "Cancelamento: passo a passo e direitos",
    description:
      "Como cancelar de forma rápida e o que esperar do processo.",
    keywords: ["cancelar", "cancelamento", "rescisão"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          Pela Lei do SAC, o cancelamento é direito do consumidor e deve ser efetivado em até
          24 horas, sem cobranças após a solicitação.
        </p>

        <h2 id="canais">Canais de cancelamento</h2>
        <ul>
          <li>WhatsApp <a href="https://wa.me/5511920047488">(11) 92004-7488</a>;</li>
          <li>0800 721 0179;</li>
          <li>Portal do Cliente → Suporte → Cancelar;</li>
          <li>Loja física.</li>
        </ul>

        <h2 id="processo">O que acontece após pedir</h2>
        <ol>
          <li>Você recebe um <strong>número de protocolo</strong>;</li>
          <li>Em até 24h, o serviço é desativado;</li>
          <li>Agendamos a retirada do equipamento (ou você devolve em loja);</li>
          <li>É emitida fatura final proporcional aos dias usados;</li>
          <li>Saldo credor é restituído em até 30 dias.</li>
        </ol>

        <HelpCallout variant="info">
          Você pode reconsiderar em até 24h após a solicitação. Basta entrar em contato com o
          mesmo protocolo.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "devolucao-equipamentos",
    title: "Devolução de equipamentos",
    description:
      "Como, quando e onde devolver ONU, roteador e decodificador após cancelamento.",
    keywords: ["devolução", "equipamento", "comodato"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="prazo">Prazo</h2>
        <p>
          Você tem <strong>30 dias</strong> a partir do cancelamento para devolver os
          equipamentos. Após esse prazo, é cobrado o valor de mercado de cada peça.
        </p>

        <h2 id="opcoes">Como devolver</h2>
        <ul>
          <li><strong>Retirada agendada:</strong> técnico passa em sua casa sem custo;</li>
          <li><strong>Loja física:</strong> entrega no balcão com seu CPF;</li>
          <li><strong>Correio:</strong> enviamos código de postagem grátis para postagem em agência.</li>
        </ul>

        <h2 id="estado">Estado de conservação</h2>
        <p>
          Devolva todos os itens recebidos: ONU, roteador, fonte, cabos, controle remoto e
          decodificador. Aceitamos desgaste natural, mas equipamentos quebrados intencionalmente
          serão cobrados.
        </p>
      </>
    ),
  },
];

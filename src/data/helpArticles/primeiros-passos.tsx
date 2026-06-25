import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const primeirosPassosArticles: HelpArticle[] = [
  {
    slug: "como-contratar",
    title: "Como contratar a Jotazo, do orçamento à ativação",
    description:
      "Conheça o passo a passo da contratação: cobertura, escolha do plano, análise cadastral, agendamento e instalação.",
    keywords: ["contratar", "como assinar", "novo cliente", "ativação"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          A contratação dos serviços Jotazo é totalmente digital e leva poucos minutos. Ao final
          deste guia, você vai entender exatamente o que acontece entre o seu primeiro clique e o
          dia em que sua internet é ativada.
        </p>

        <h2 id="cobertura">1. Verificação de cobertura</h2>
        <p>
          Antes de qualquer coisa, confirme se sua rua está dentro da nossa área de atendimento.
          Acesse a página <a href="/cobertura">Cobertura</a> e digite seu CEP completo. Em poucos
          segundos o sistema mostra se há fibra disponível, qual a velocidade máxima suportada e
          quais combos são possíveis para o seu endereço.
        </p>

        <h2 id="plano">2. Escolha do plano</h2>
        <p>
          Você pode escolher entre planos de fibra (100, 550, 750 ou 900 Mega), TV por
          streaming, internet móvel 5G e combos convergentes. Use o configurador
          <a href="/monte-seu-combo"> Monte seu Combo</a> para combinar serviços com o desconto
          aplicado automaticamente.
        </p>

        <h2 id="cadastro">3. Cadastro e análise</h2>
        <p>
          Você precisa ter <strong>CPF próprio</strong>, ser maior de 18 anos e residir no
          endereço de instalação. Para empresas, é necessário CNPJ ativo. A análise de crédito é
          feita junto a birôs (Serasa, SPC) e leva poucos minutos.
        </p>
        <HelpCallout variant="tip" title="Acelere a aprovação">
          Tenha em mãos um documento com foto, comprovante de endereço recente (até 90 dias) e um
          telefone de contato que esteja em uso.
        </HelpCallout>

        <h2 id="agendamento">4. Agendamento da instalação</h2>
        <p>
          Após aprovado, nossa central entra em contato em até 24 horas úteis para escolher
          juntos a data e o turno (manhã ou tarde) que sejam melhores para você.
        </p>

        <h2 id="instalacao">5. Dia da instalação</h2>
        <p>
          Um técnico identificado e uniformizado vai até o endereço, leva o cabo de fibra do
          poste até o ponto interno escolhido, instala a ONU/ONT, configura o roteador Wi-Fi e
          faz testes de velocidade. A visita dura, em média, 1h30.
        </p>
        <HelpCallout variant="warning" title="Antes do técnico chegar">
          Decida onde quer instalar o ponto de acesso (preferencialmente no centro da casa, em
          local elevado e ventilado). Garanta que haja uma tomada disponível.
        </HelpCallout>

        <h2 id="ativacao">6. Ativação e pós-venda</h2>
        <p>
          O técnico só vai embora quando o sinal estiver estável e você conseguir navegar.
          Em até 48 horas você recebe um e-mail com seus dados de acesso ao Portal do Cliente,
          informações da fatura e canais de suporte.
        </p>
      </>
    ),
    related: [
      { categorySlug: "primeiros-passos", articleSlug: "dia-da-instalacao" },
      { categorySlug: "primeiros-passos", articleSlug: "kit-equipamentos" },
    ],
  },
  {
    slug: "dia-da-instalacao",
    title: "O que esperar no dia da instalação",
    description:
      "Saiba o que o técnico faz, quanto tempo dura a visita e como se preparar para tudo dar certo.",
    keywords: ["instalação", "técnico", "visita", "preparação"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          A instalação da fibra é uma das etapas mais importantes para a qualidade do seu serviço.
          Saber o que esperar evita surpresas e ajuda você a tomar decisões melhores.
        </p>

        <h2 id="duracao">Duração e horário</h2>
        <p>
          A visita técnica leva em média <strong>1h a 2h</strong>. Atendemos em dois turnos: manhã
          (8h às 12h) e tarde (13h às 18h). O técnico avisa por WhatsApp quando está a caminho.
        </p>

        <h2 id="o-que-fazem">O que o técnico faz</h2>
        <ul>
          <li>Identifica a caixa de atendimento mais próxima do poste;</li>
          <li>Passa o cabo drop óptico do poste até o ponto interno escolhido;</li>
          <li>Faz a fusão óptica (emenda do cabo) com equipamento profissional;</li>
          <li>Mede a potência do sinal (deve estar entre <strong>-15 e -25 dBm</strong>);</li>
          <li>Instala e configura a ONU/ONT e o roteador Wi-Fi;</li>
          <li>Realiza teste de velocidade e mostra os resultados.</li>
        </ul>

        <h2 id="onde-instalar">Onde posicionar o ponto de Wi-Fi</h2>
        <HelpCallout variant="tip" title="Dica do instalador">
          Posicione o roteador no <strong>centro da casa</strong>, em altura média (cima de móvel
          ou na parede), longe de paredes grossas, espelhos e geladeira. Evite armários fechados.
        </HelpCallout>

        <h2 id="documentos">Documentos necessários</h2>
        <p>
          Tenha em mãos um documento com foto. Se você não for o titular do contrato, deixe uma
          pessoa autorizada com cópia do RG/CPF do titular.
        </p>

        <h2 id="reagendar">Posso reagendar?</h2>
        <p>
          Sim, gratuitamente, com pelo menos 4 horas de antecedência, pelo WhatsApp ou pelo nosso
          0800. Reagendamentos no mesmo dia podem ter o atendimento empurrado em 2 dias úteis,
          conforme agenda da equipe.
        </p>
      </>
    ),
    related: [
      { categorySlug: "primeiros-passos", articleSlug: "kit-equipamentos" },
      { categorySlug: "internet-fibra", articleSlug: "posicionar-roteador" },
    ],
  },
  {
    slug: "kit-equipamentos",
    title: "Conhecendo seu kit: ONU/ONT, roteador e decodificador",
    description:
      "Entenda cada equipamento que você recebe em comodato e qual a função de cada peça.",
    keywords: ["ont", "onu", "roteador", "kit", "equipamento"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          Todos os equipamentos da Jotazo são cedidos em <strong>regime de comodato</strong>:
          você usa enquanto for cliente e devolve em caso de cancelamento. Veja para que serve
          cada um.
        </p>

        <h2 id="onu">ONU/ONT</h2>
        <p>
          A ONU (Optical Network Unit) — também chamada de ONT — é o equipamento que recebe o
          sinal óptico vindo da fibra e o converte para o padrão Ethernet. Ela tem três luzes
          principais: <strong>Power</strong>, <strong>PON</strong> e <strong>LOS</strong>. Em
          operação normal, Power e PON ficam verdes fixas e LOS apagado.
        </p>

        <h2 id="roteador">Roteador Wi-Fi</h2>
        <p>
          Distribui a internet por cabo (LAN) e por Wi-Fi nas frequências de 2.4 GHz e 5 GHz. Os
          modelos enviados em planos a partir de 550 Mega já são <strong>Wi-Fi 6</strong>,
          oferecendo maior alcance e suporte a mais dispositivos simultâneos.
        </p>

        <h2 id="decodificador">Decodificador / receptor de TV</h2>
        <p>
          Apenas para clientes do plano de TV. Conecta na TV via HDMI e recebe o sinal por IP
          através da internet, com suporte a controle remoto, gravação e streaming integrado.
        </p>

        <h2 id="cuidados">Cuidados básicos</h2>
        <HelpCallout variant="danger" title="Não faça">
          <ul>
            <li>Não dobre o cabo de fibra (raio mínimo de 3 cm);</li>
            <li>Não desligue ou abra a ONU sem orientação técnica;</li>
            <li>Não cole adesivos ou tampe as aberturas de ventilação.</li>
          </ul>
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "suporte-tecnico", articleSlug: "luzes-da-onu" },
      { categorySlug: "internet-fibra", articleSlug: "posicionar-roteador" },
    ],
  },
  {
    slug: "portal-do-cliente",
    title: "Primeiro acesso ao Portal do Cliente",
    description:
      "Como acessar a Central do Assinante para emitir 2ª via, alterar dados e consultar planos.",
    keywords: ["portal", "central do assinante", "login", "primeiro acesso"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          O Portal do Cliente é onde você gerencia tudo: faturas, plano, contatos, atendimentos
          abertos e dados cadastrais.
        </p>

        <h2 id="acessar">Como acessar</h2>
        <p>
          Acesse <a href="https://jotazo.rbxsoft.com/app_login/app_login.php" target="_blank" rel="noreferrer">
          jotazo.rbxsoft.com</a>. No primeiro acesso:
        </p>
        <ol>
          <li>Clique em <strong>"Esqueci minha senha"</strong>;</li>
          <li>Informe seu CPF/CNPJ cadastrado;</li>
          <li>Você recebe um e-mail com link para criar sua senha;</li>
          <li>Crie uma senha forte (mínimo 8 caracteres, com letras e números);</li>
          <li>Faça login com CPF/CNPJ e a nova senha.</li>
        </ol>

        <h2 id="recursos">O que você consegue fazer</h2>
        <ul>
          <li>Emitir 2ª via de boleto e Pix instantâneo;</li>
          <li>Ver histórico de faturas dos últimos 24 meses;</li>
          <li>Cadastrar débito automático e cartão;</li>
          <li>Atualizar e-mail, celular e endereço de cobrança;</li>
          <li>Consultar contratos e protocolos de atendimento.</li>
        </ul>

        <HelpCallout variant="tip">
          Salve o link do portal nos favoritos e ative notificações por e-mail para receber a
          fatura no dia em que ela é gerada.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "conta-pagamento", articleSlug: "segunda-via-boleto" },
      { categorySlug: "conta-pagamento", articleSlug: "metodos-pagamento" },
    ],
  },
  {
    slug: "app-jotazo",
    title: "App Jotazo: tour completo",
    description:
      "Conheça as principais funções do aplicativo e dicas para tirar o máximo proveito dele.",
    keywords: ["aplicativo", "app", "celular"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          O app Jotazo concentra suporte, faturas, teste de velocidade e contato com o time em um
          único lugar. Disponível para iOS e Android.
        </p>

        <h2 id="instalar">Instalando o app</h2>
        <ol>
          <li>Abra a App Store ou Play Store no seu celular;</li>
          <li>Busque por <strong>"Jotazo"</strong>;</li>
          <li>Instale e abra o app;</li>
          <li>Faça login com CPF/CNPJ e a senha do Portal do Cliente.</li>
        </ol>

        <h2 id="recursos">Principais recursos</h2>
        <ul>
          <li><strong>Pagar fatura:</strong> copie o código de barras ou pague via Pix;</li>
          <li><strong>Teste de velocidade:</strong> mede sua conexão e salva o histórico;</li>
          <li><strong>Suporte:</strong> abertura de chamado em poucos toques;</li>
          <li><strong>Wi-Fi:</strong> trocar nome (SSID) e senha do Wi-Fi remotamente;</li>
          <li><strong>Notificações:</strong> avisos de manutenção, vencimento e novas ofertas.</li>
        </ul>

        <HelpCallout variant="info" title="Dica">
          Ative o login biométrico (digital ou Face ID) nas configurações para entrar mais rápido
          e com mais segurança.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "primeiros-passos", articleSlug: "portal-do-cliente" },
      { categorySlug: "suporte-tecnico", articleSlug: "teste-velocidade" },
    ],
  },
];

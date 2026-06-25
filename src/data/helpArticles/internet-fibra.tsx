import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const internetFibraArticles: HelpArticle[] = [
  {
    slug: "como-funciona-fibra",
    title: "Como a fibra óptica funciona",
    description:
      "Entenda em linguagem simples o que é FTTH, GPON e por que a fibra é tão superior ao cabo.",
    keywords: ["fibra", "ftth", "gpon", "como funciona"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          A fibra óptica é a tecnologia mais avançada disponível para internet residencial. Em vez
          de transportar sinais elétricos por cabos de cobre, ela transmite <strong>pulsos de
          luz</strong> por finíssimos filamentos de vidro — que cabem dentro de um cabo do tamanho
          de um fio de cabelo.
        </p>

        <h2 id="ftth">O que é FTTH</h2>
        <p>
          FTTH (<em>Fiber to the Home</em>, "Fibra até a Casa") significa que a fibra chega
          inteira até o seu imóvel, sem passar por trechos de cobre. É o melhor padrão possível.
          Existem variações como FTTC (até a calçada) e FTTB (até o prédio), que perdem qualidade
          no trecho final.
        </p>

        <h2 id="gpon">O que é GPON</h2>
        <p>
          GPON (<em>Gigabit Passive Optical Network</em>) é o protocolo usado para entregar sinal
          a vários clientes a partir da mesma fibra do bairro, sem perder velocidade. É como uma
          rodovia de alta capacidade ramificada por divisores ópticos passivos (splitters).
        </p>

        <h2 id="vantagens">Vantagens em relação ao cabo coaxial e ADSL</h2>
        <ul>
          <li><strong>Velocidades simétricas</strong> (mesmo download e upload);</li>
          <li><strong>Latência baixíssima</strong> (essencial para games e videochamadas);</li>
          <li><strong>Imune a interferência</strong> elétrica e raios;</li>
          <li><strong>Maior estabilidade</strong> em períodos de chuva e calor;</li>
          <li>Capacidade de evoluir para velocidades muito maiores no futuro.</li>
        </ul>

        <HelpCallout variant="tip" title="Curiosidade">
          A luz percorre a fibra a cerca de 200 mil km/s — quase a velocidade da luz no vácuo.
          Por isso o tempo de resposta (<em>ping</em>) é tão baixo.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "mbps-vs-mb" },
      { categorySlug: "internet-fibra", articleSlug: "velocidade-anatel" },
    ],
  },
  {
    slug: "mbps-vs-mb",
    title: "Mbps vs MB/s: por que o download parece mais lento",
    description:
      "A diferença entre megabits e megabytes que confunde quase todo mundo, explicada de uma vez por todas.",
    keywords: ["mbps", "mb/s", "velocidade", "download"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          Se você contratou um plano de <strong>800 Mbps</strong> e seu navegador mostra que o
          arquivo está baixando a <strong>100 MB/s</strong>, fique tranquilo: está tudo certo.
          A confusão é por causa das unidades.
        </p>

        <h2 id="diferenca">A diferença</h2>
        <ul>
          <li><strong>Mbps</strong> = megabit por segundo (b minúsculo). Unidade usada pelas operadoras.</li>
          <li><strong>MB/s</strong> = megabyte por segundo (B maiúsculo). Unidade usada pelo navegador.</li>
        </ul>
        <p>
          1 byte = 8 bits. Para converter de Mbps para MB/s, basta dividir por 8.
        </p>

        <h2 id="exemplos">Exemplos com planos Jotazo</h2>
        <table>
          <thead>
            <tr>
              <th>Plano</th>
              <th>Mbps</th>
              <th>Equivale a</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>100 Mega</td><td>100 Mbps</td><td>~12,5 MB/s</td></tr>
            <tr><td>550 Mega</td><td>550 Mbps</td><td>~68,7 MB/s</td></tr>
            <tr><td>750 Mega</td><td>750 Mbps</td><td>~93,7 MB/s</td></tr>
            <tr><td>900 Mega</td><td>900 Mbps</td><td>~112,5 MB/s</td></tr>
          </tbody>
        </table>

        <HelpCallout variant="info" title="Por que medir em bits?">
          O setor de telecomunicações sempre mediu transmissão em bits. O setor de armazenamento
          (HDs, pen drives) sempre mediu em bytes. Como a internet entrega dados que serão
          armazenados, as duas unidades convivem.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "velocidade-anatel" },
      { categorySlug: "suporte-tecnico", articleSlug: "teste-velocidade" },
    ],
  },
  {
    slug: "velocidade-anatel",
    title: "Velocidade contratada vs entregue: o que diz a Anatel",
    description:
      "Entenda os parâmetros mínimos garantidos por lei e como medir corretamente sua conexão.",
    keywords: ["velocidade", "anatel", "574", "garantia"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A <strong>Resolução Anatel nº 574/2011</strong> regula a qualidade da banda larga fixa
          no Brasil. Ela define o que precisa ser entregue ao cliente:
        </p>

        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Mínimo garantido</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Velocidade instantânea</td>
              <td><strong>40%</strong> da velocidade contratada</td>
            </tr>
            <tr>
              <td>Velocidade média mensal</td>
              <td><strong>80%</strong> da velocidade contratada</td>
            </tr>
            <tr>
              <td>Disponibilidade mensal</td>
              <td><strong>95%</strong> do tempo</td>
            </tr>
          </tbody>
        </table>

        <h2 id="como-medir">Como medir corretamente</h2>
        <ol>
          <li>Use um cabo de rede (Ethernet) ligado direto à ONU, descartando o Wi-Fi;</li>
          <li>Use um computador moderno (Wi-Fi antigo ou roteador próprio podem ser o gargalo);</li>
          <li>Feche outros dispositivos e downloads em segundo plano;</li>
          <li>Faça o teste em <a href="https://www.brasilbandalarga.com.br" target="_blank" rel="noreferrer">brasilbandalarga.com.br</a> (ferramenta oficial da Anatel) ou no nosso <a href="/teste-de-velocidade">Teste de Velocidade</a>.</li>
        </ol>

        <HelpCallout variant="warning" title="Atenção ao Wi-Fi">
          O Wi-Fi tem limites físicos. Em planos acima de 500 Mbps, é normal o teste pelo Wi-Fi
          mostrar valores menores. Para validar a velocidade real, use sempre o cabo.
        </HelpCallout>

        <h2 id="reclamar">Velocidade abaixo do mínimo: o que fazer</h2>
        <ol>
          <li>Faça pelo menos 3 medições em horários diferentes via cabo;</li>
          <li>Tire prints com data e hora visíveis;</li>
          <li>Abra um chamado pelo nosso suporte com os prints;</li>
          <li>Caso o problema persista, registre na Anatel pelo 1331.</li>
        </ol>
      </>
    ),
    related: [
      { categorySlug: "suporte-tecnico", articleSlug: "teste-velocidade" },
      { categorySlug: "suporte-tecnico", articleSlug: "lentidao-internet" },
    ],
  },
  {
    slug: "posicionar-roteador",
    title: "Posicionamento ideal do roteador para máxima cobertura",
    description:
      "Onde colocar (e onde NÃO colocar) o roteador para o Wi-Fi alcançar todos os cantos da casa.",
    keywords: ["roteador", "posição", "wifi", "alcance", "cobertura"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          O Wi-Fi se propaga em todas as direções, como ondas concêntricas. Um centímetro a mais
          no lugar certo pode dobrar o alcance. Veja as regras essenciais.
        </p>

        <h2 id="onde-sim">Onde posicionar</h2>
        <ul>
          <li>No <strong>centro geográfico</strong> da casa, considerando todos os cômodos que precisam de sinal;</li>
          <li>Em <strong>altura média</strong> (1m a 1,80m), em cima de um móvel ou na parede;</li>
          <li>Em local <strong>aberto e ventilado</strong>;</li>
          <li>Com as <strong>antenas verticais</strong> (em pé) — ondas se propagam horizontalmente.</li>
        </ul>

        <h2 id="onde-nao">Onde nunca posicionar</h2>
        <HelpCallout variant="danger" title="Inimigos do Wi-Fi">
          <ul>
            <li>Atrás da TV (a TV bloqueia o sinal);</li>
            <li>Dentro de armário ou rack fechado;</li>
            <li>Perto de espelhos, geladeiras, micro-ondas e aquários;</li>
            <li>Encostado em parede de concreto armado;</li>
            <li>No chão (a propagação fica limitada à altura).</li>
          </ul>
        </HelpCallout>

        <h2 id="paredes">Paredes e materiais que mais bloqueiam</h2>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Atenuação aproximada</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Drywall</td><td>3 a 5 dB</td></tr>
            <tr><td>Tijolo comum</td><td>5 a 10 dB</td></tr>
            <tr><td>Concreto armado</td><td>15 a 25 dB</td></tr>
            <tr><td>Espelho / vidro espelhado</td><td>10 a 20 dB</td></tr>
            <tr><td>Metal / aço</td><td>20 dB+ (praticamente bloqueia)</td></tr>
          </tbody>
        </table>

        <HelpCallout variant="tip" title="Casa grande?">
          Considere adicionar repetidores ou um sistema Mesh — mais detalhes no artigo
          <a href="/ajuda/internet-fibra/wifi-casa-grande"> "Como melhorar o Wi-Fi em casa de 2 andares"</a>.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "wifi-casa-grande" },
      { categorySlug: "internet-fibra", articleSlug: "banda-2-4-vs-5" },
    ],
  },
  {
    slug: "wifi-5-vs-wifi-6",
    title: "Wi-Fi 5 vs Wi-Fi 6: qual escolher?",
    description:
      "Comparativo objetivo entre as duas gerações mais usadas e quando vale a pena migrar.",
    keywords: ["wifi 5", "wifi 6", "ax", "ac"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="resumo">Resumo</h2>
        <p>
          O <strong>Wi-Fi 5 (802.11ac)</strong> é o padrão dominante desde 2014. O <strong>Wi-Fi 6
          (802.11ax)</strong>, lançado em 2019, é mais rápido, mais eficiente em ambientes lotados
          e consome menos bateria nos dispositivos.
        </p>

        <h2 id="comparativo">Comparativo</h2>
        <table>
          <thead>
            <tr>
              <th>Característica</th>
              <th>Wi-Fi 5</th>
              <th>Wi-Fi 6</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Velocidade máxima teórica</td><td>3,5 Gbps</td><td>9,6 Gbps</td></tr>
            <tr><td>Bandas</td><td>5 GHz</td><td>2.4 + 5 GHz</td></tr>
            <tr><td>Vários dispositivos simultâneos</td><td>Limitado</td><td>Excelente (OFDMA)</td></tr>
            <tr><td>Bateria de IoT</td><td>—</td><td>Target Wake Time</td></tr>
            <tr><td>Compatibilidade</td><td>Universal</td><td>Compatível com tudo</td></tr>
          </tbody>
        </table>

        <h2 id="quando-trocar">Quando vale a pena migrar</h2>
        <ul>
          <li>Se sua casa tem mais de 10 dispositivos conectados;</li>
          <li>Se você assina plano de <strong>500 Mbps ou mais</strong>;</li>
          <li>Se há vários streamings 4K simultâneos;</li>
          <li>Se você joga online em consoles compatíveis (PS5, Xbox Series).</li>
        </ul>

        <HelpCallout variant="info">
          Os planos Jotazo a partir de <strong>550 Mega</strong> já vêm com roteador Wi-Fi 6 sem
          custo adicional.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "banda-2-4-vs-5" },
      { categorySlug: "internet-fibra", articleSlug: "posicionar-roteador" },
    ],
  },
  {
    slug: "banda-2-4-vs-5",
    title: "2.4 GHz vs 5 GHz: quando usar cada banda",
    description:
      "As duas bandas têm vantagens diferentes. Veja qual faz sentido para cada dispositivo.",
    keywords: ["2.4 ghz", "5 ghz", "banda", "wifi"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="comparativo">Comparativo rápido</h2>
        <table>
          <thead>
            <tr>
              <th>Característica</th>
              <th>2.4 GHz</th>
              <th>5 GHz</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alcance</td><td>Maior (atravessa paredes)</td><td>Menor</td></tr>
            <tr><td>Velocidade</td><td>Até ~150 Mbps</td><td>Centenas de Mbps a Gbps</td></tr>
            <tr><td>Interferência</td><td>Alta (Bluetooth, micro-ondas)</td><td>Baixa</td></tr>
            <tr><td>Ideal para</td><td>IoT, lâmpadas, câmeras</td><td>Notebooks, celulares, TV</td></tr>
          </tbody>
        </table>

        <h2 id="usar">Quando usar cada uma</h2>
        <ul>
          <li><strong>2.4 GHz</strong> — dispositivos IoT (campainhas, fechaduras, lâmpadas), distantes do roteador, ou que não exigem alta velocidade.</li>
          <li><strong>5 GHz</strong> — celulares, notebooks, TV, console, qualquer coisa próxima do roteador que precise de velocidade.</li>
        </ul>

        <HelpCallout variant="tip" title="Banda única (Smart Connect)">
          Roteadores modernos permitem usar o <strong>mesmo nome de Wi-Fi</strong> para as duas
          bandas. O dispositivo escolhe a melhor automaticamente. É a configuração padrão dos
          roteadores Jotazo.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "wifi-5-vs-wifi-6" },
      { categorySlug: "internet-fibra", articleSlug: "posicionar-roteador" },
    ],
  },
  {
    slug: "cabos-de-rede",
    title: "Cabos de rede: Cat5e, Cat6 ou Cat6a?",
    description:
      "Qual cabo usar entre o roteador e seus dispositivos para não sabotar a velocidade.",
    keywords: ["cabo de rede", "cat5e", "cat6", "ethernet"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          O Wi-Fi é prático, mas o cabo é imbatível em estabilidade e velocidade. Para tirar o
          máximo do plano, vale a pena usar cabo no PC, PS5/Xbox e TV.
        </p>

        <h2 id="categorias">Categorias e velocidades</h2>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Velocidade</th>
              <th>Frequência</th>
              <th>Uso recomendado</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Cat5e</td><td>1 Gbps</td><td>100 MHz</td><td>Suficiente para até 1 Gbps</td></tr>
            <tr><td>Cat6</td><td>1 Gbps (até 10 Gbps em curto alcance)</td><td>250 MHz</td><td>Padrão atual recomendado</td></tr>
            <tr><td>Cat6a</td><td>10 Gbps em até 100m</td><td>500 MHz</td><td>Casas modernas e empresas</td></tr>
          </tbody>
        </table>

        <HelpCallout variant="warning" title="Cuidados">
          <ul>
            <li>Não use cabos genéricos sem certificação — eles geralmente não entregam o que prometem;</li>
            <li>Verifique se as portas LAN do roteador e do dispositivo são <strong>Gigabit (1000 Mbps)</strong>. Portas 10/100 limitam em 100 Mbps;</li>
            <li>Evite cabos muito longos (acima de 50m sem qualidade).</li>
          </ul>
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "velocidade-anatel" },
    ],
  },
  {
    slug: "wifi-casa-grande",
    title: "Como melhorar o Wi-Fi em casa de 2 andares",
    description:
      "Repetidores, sistemas mesh, Powerline e dicas práticas para cobertura total.",
    keywords: ["mesh", "repetidor", "sobrado", "andar", "cobertura"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          Em sobrados, casas grandes ou ambientes com muitas paredes, o sinal de um único
          roteador pode não ser suficiente. Veja as três principais soluções.
        </p>

        <h2 id="mesh">1. Sistema Mesh (recomendado)</h2>
        <p>
          São conjuntos de 2 ou 3 roteadores que conversam entre si e formam uma única rede com
          o mesmo nome. Você anda pela casa e o seu celular troca de ponto sem perceber. É a
          melhor experiência possível.
        </p>

        <h2 id="repetidor">2. Repetidor de sinal</h2>
        <p>
          Mais barato, mas perde performance: o repetidor copia o sinal do roteador, geralmente
          reduzindo a velocidade pela metade. Útil para esticar o alcance em pontos específicos.
        </p>

        <h2 id="powerline">3. Powerline (PLC)</h2>
        <p>
          Usa a fiação elétrica para levar a internet a outro cômodo. Funciona razoavelmente bem
          quando a instalação elétrica é estável, mas oscila bastante.
        </p>

        <HelpCallout variant="tip" title="Dica do técnico">
          Em casas de 2 andares, o ideal é colocar o ponto principal próximo do <strong>teto do andar de baixo</strong>
          (ou no chão do andar de cima) e usar uma unidade Mesh em cada andar. Pergunte ao nosso
          atendimento sobre a opção de Wi-Fi Plus.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "internet-fibra", articleSlug: "posicionar-roteador" },
      { categorySlug: "internet-fibra", articleSlug: "wifi-5-vs-wifi-6" },
    ],
  },
];

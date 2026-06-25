import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const suporteTecnicoArticles: HelpArticle[] = [
  {
    slug: "internet-caiu",
    title: "Minha internet caiu: checklist antes de abrir chamado",
    description:
      "Em mais de 80% dos casos é possível resolver sozinho seguindo 5 passos simples.",
    keywords: ["internet caiu", "sem internet", "diagnóstico"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          Antes de ligar para o suporte, faça este checklist rápido. Resolve em segundos casos
          que pareciam graves.
        </p>

        <h2 id="passo-1">1. Olhe as luzes da ONU</h2>
        <p>
          A luz <strong>POWER</strong> precisa estar verde fixa. A luz <strong>PON</strong>
          também verde fixa. Se a luz <strong>LOS</strong> estiver vermelha piscando, é falha
          no sinal de fibra — siga para o
          <a href="/ajuda/suporte-tecnico/luzes-da-onu"> guia das luzes</a>.
        </p>

        <h2 id="passo-2">2. Reinicie o roteador corretamente</h2>
        <ol>
          <li>Tire o cabo de energia do roteador (e da ONU se for separado);</li>
          <li>Aguarde 30 segundos completos;</li>
          <li>Ligue primeiro a ONU, espere 1 minuto, depois ligue o roteador;</li>
          <li>Aguarde 2 minutos para sincronização.</li>
        </ol>

        <h2 id="passo-3">3. Teste em mais de um dispositivo</h2>
        <p>
          Se a internet funciona no celular mas não no notebook, o problema é no notebook (driver,
          configuração). Teste em pelo menos dois dispositivos antes de concluir que está sem
          serviço.
        </p>

        <h2 id="passo-4">4. Cheque a fatura</h2>
        <p>
          Se houver atraso superior a 30 dias, o serviço pode estar suspenso. Verifique no Portal
          do Cliente.
        </p>

        <h2 id="passo-5">5. Verifique manutenções programadas</h2>
        <p>
          Acesse o app ou siga nossas redes sociais para ver se há aviso de manutenção em sua
          região. Avisamos com antecedência sempre que possível.
        </p>

        <HelpCallout variant="success" title="Continua sem internet?">
          Abra um chamado pelo WhatsApp <a href="https://wa.me/5511920047488">(11) 92004-7488</a>
          ou ligue para <strong>0800 721 0179</strong>. Tenha em mãos seu CPF e o nome do titular.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "suporte-tecnico", articleSlug: "luzes-da-onu" },
      { categorySlug: "suporte-tecnico", articleSlug: "reiniciar-roteador" },
    ],
  },
  {
    slug: "lentidao-internet",
    title: "Lentidão na internet: como diagnosticar",
    description:
      "Roteiro técnico para descobrir se o problema é na fibra, no Wi-Fi ou no seu dispositivo.",
    keywords: ["lentidão", "lento", "diagnóstico"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          Lentidão não significa que a internet está fora. Vamos isolar a causa.
        </p>

        <h2 id="cabo">1. Teste com cabo de rede</h2>
        <p>
          Conecte seu computador direto à ONU com um cabo. Faça o teste em
          <a href="/teste-de-velocidade"> teste-de-velocidade</a>. Se a velocidade vier dentro do
          contratado, o problema é o Wi-Fi (consulte
          <a href="/ajuda/internet-fibra/posicionar-roteador"> Posicionamento do roteador</a>).
        </p>

        <h2 id="dispositivos">2. Veja quem está usando</h2>
        <p>
          Streamings em 4K, downloads, atualizações de jogos (PS5, Xbox, Steam) podem consumir
          dezenas de Mbps cada. Pause-os e refaça o teste.
        </p>

        <h2 id="dns">3. Mude o DNS</h2>
        <p>
          DNS lento atrasa a abertura de sites. Configure no seu roteador ou no Wi-Fi do
          dispositivo:
        </p>
        <ul>
          <li>Cloudflare: <code>1.1.1.1</code> e <code>1.0.0.1</code></li>
          <li>Google: <code>8.8.8.8</code> e <code>8.8.4.4</code></li>
        </ul>

        <h2 id="wifi-canal">4. Wi-Fi com interferência</h2>
        <p>
          Em prédios ou ruas movimentadas, dezenas de Wi-Fi competem pelo mesmo canal. Reinicie o
          roteador (ele escolhe outro canal) ou troque manualmente para <strong>canal 1, 6 ou
          11</strong> em 2.4 GHz.
        </p>

        <HelpCallout variant="info">
          Mesmo com plano de 900 Mega, é normal o Wi-Fi entregar de 200–500 Mbps no celular.
          Para velocidades acima disso, use o cabo.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "suporte-tecnico", articleSlug: "teste-velocidade" },
      { categorySlug: "internet-fibra", articleSlug: "velocidade-anatel" },
    ],
  },
  {
    slug: "reiniciar-roteador",
    title: "Como reiniciar o roteador corretamente",
    description:
      "A ordem importa. Veja a sequência certa que resolve a maioria dos problemas.",
    keywords: ["reiniciar", "reset", "roteador", "modem"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="diferenca">Reiniciar é diferente de resetar</h2>
        <ul>
          <li><strong>Reiniciar</strong> — apenas desliga e liga. Não apaga configurações. Faça sempre que tiver problema.</li>
          <li><strong>Resetar</strong> — volta para o estado de fábrica. Apaga senha do Wi-Fi e configurações. Só faça em último caso.</li>
        </ul>

        <h2 id="sequencia">Sequência correta de reinicialização</h2>
        <ol>
          <li>Tire o cabo de energia da ONU/ONT;</li>
          <li>Tire o cabo de energia do roteador (se for equipamento separado);</li>
          <li>Aguarde <strong>30 segundos</strong> (importante);</li>
          <li>Ligue primeiro a ONU, espere a luz PON ficar verde fixa (~1 minuto);</li>
          <li>Ligue o roteador e aguarde 2 minutos para a sincronização completa;</li>
          <li>Conecte um dispositivo e teste.</li>
        </ol>

        <HelpCallout variant="warning" title="Não use o botão Reset">
          O botão pequeno na traseira (geralmente precisa de palito) é o RESET de fábrica, não
          o reinício. Ele apaga o nome do Wi-Fi, a senha e todas as configurações.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "luzes-da-onu",
    title: "Luzes da ONU/ONT: o que cada cor significa",
    description:
      "Guia visual completo das luzes Power, PON, LOS, LAN e o que fazer em cada caso.",
    keywords: ["luzes", "ont", "onu", "los vermelho", "pon"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          As luzes da ONU contam tudo o que você precisa saber sobre a saúde da sua conexão.
          Aprenda a lê-las.
        </p>

        <h2 id="power">POWER (PWR)</h2>
        <ul>
          <li><strong>Verde fixa</strong> — equipamento ligado, normal.</li>
          <li><strong>Apagada</strong> — sem energia. Verifique a tomada e a fonte.</li>
        </ul>

        <h2 id="pon">PON</h2>
        <ul>
          <li><strong>Verde fixa</strong> — sinal óptico OK, normal.</li>
          <li><strong>Verde piscando</strong> — autenticando ou recém-ligada. Aguarde 2 minutos.</li>
          <li><strong>Apagada</strong> — sem sinal de fibra. Veja LOS.</li>
        </ul>

        <h2 id="los">LOS (Loss of Signal)</h2>
        <ul>
          <li><strong>Apagada</strong> — sinal OK, normal.</li>
          <li><strong>Vermelha piscando</strong> — perda de sinal. Pode ser cabo dobrado, conector solto ou rompimento na rua.</li>
        </ul>

        <HelpCallout variant="danger" title="LOS vermelho: o que NÃO fazer">
          <ul>
            <li>Não puxe ou desconecte o cabo de fibra (filamento de vidro frágil);</li>
            <li>Não tente "limpar" o conector com pano ou álcool;</li>
            <li>Não abra a ONU.</li>
          </ul>
          Abra um chamado e nossa equipe vai até você.
        </HelpCallout>

        <h2 id="lan">LAN 1, 2, 3, 4</h2>
        <ul>
          <li><strong>Verde fixa</strong> — dispositivo conectado mas sem tráfego.</li>
          <li><strong>Verde piscando</strong> — tráfego de dados em andamento. Normal.</li>
          <li><strong>Apagada</strong> — sem dispositivo conectado nessa porta.</li>
        </ul>
      </>
    ),
    related: [
      { categorySlug: "suporte-tecnico", articleSlug: "internet-caiu" },
    ],
  },
  {
    slug: "teste-velocidade",
    title: "Teste de velocidade: como executar e interpretar",
    description:
      "Entenda download, upload, ping, jitter e perda — e o que cada métrica significa.",
    keywords: ["teste velocidade", "speedtest", "ping", "jitter"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="executar">Como executar corretamente</h2>
        <ol>
          <li>Conecte o dispositivo direto à ONU por cabo;</li>
          <li>Pause downloads, atualizações e streamings em outros dispositivos;</li>
          <li>Acesse <a href="/teste-de-velocidade">teste-de-velocidade</a>;</li>
          <li>Aguarde a medição completa (~30 segundos).</li>
        </ol>

        <h2 id="metricas">O que cada métrica significa</h2>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>O que mede</th>
              <th>Bom valor</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Download</td><td>Velocidade de recebimento</td><td>≥ 80% do contratado (média)</td></tr>
            <tr><td>Upload</td><td>Velocidade de envio</td><td>≥ 80% do contratado</td></tr>
            <tr><td>Ping</td><td>Tempo de resposta a um servidor</td><td>≤ 30 ms</td></tr>
            <tr><td>Jitter</td><td>Variação do ping</td><td>≤ 10 ms</td></tr>
            <tr><td>Perda de pacotes</td><td>% de pacotes perdidos</td><td>0%</td></tr>
          </tbody>
        </table>

        <HelpCallout variant="tip">
          Para games online, ping baixo e jitter baixo são mais importantes que velocidade alta.
          A fibra Jotazo tipicamente entrega ping abaixo de 15 ms para servidores em São Paulo.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "wifi-sem-internet",
    title: "Wi-Fi conecta mas não tem internet",
    description:
      "Quando o ícone do Wi-Fi tem o ponto de exclamação amarelo, isso geralmente indica.",
    keywords: ["wifi sem internet", "exclamação amarela", "no internet"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          Esse erro acontece quando seu dispositivo conecta com sucesso ao roteador, mas o
          roteador não está conseguindo se comunicar com a internet ou repassar para você.
        </p>

        <h2 id="passos">Passos rápidos</h2>
        <ol>
          <li>Reinicie o roteador (veja o artigo correto);</li>
          <li>Esqueça a rede no celular: <strong>Configurações → Wi-Fi → toque na rede → Esquecer</strong> e conecte de novo;</li>
          <li>Verifique a hora/data do dispositivo (relógio errado bloqueia conexões HTTPS);</li>
          <li>Desligue VPNs;</li>
          <li>Em último caso, faça reset de rede do celular.</li>
        </ol>

        <HelpCallout variant="info">
          Se outros dispositivos navegam normalmente pelo mesmo Wi-Fi, o problema é específico
          desse aparelho.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "tv-pixelada",
    title: "TV travando ou pixelada: causas e soluções",
    description:
      "Imagem quadriculada ou que congela: como diagnosticar.",
    keywords: ["tv pixelada", "travando", "congelando", "imagem ruim"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="causas">Causas mais comuns</h2>
        <ol>
          <li><strong>Wi-Fi instável</strong> entre o decodificador e o roteador;</li>
          <li><strong>Outro dispositivo consumindo banda</strong> em 4K ou download;</li>
          <li><strong>HDMI mal encaixado</strong> ou cabo defeituoso;</li>
          <li><strong>Atualização em andamento</strong> no decodificador;</li>
          <li>Manutenção pontual no canal.</li>
        </ol>

        <h2 id="solucoes">Soluções</h2>
        <ul>
          <li>Conecte o decodificador <strong>via cabo de rede</strong> ao roteador, sempre que possível;</li>
          <li>Reinicie o decodificador (tire da tomada por 30 segundos);</li>
          <li>Troque o cabo HDMI por um <strong>HDMI 2.0 certificado</strong>;</li>
          <li>Verifique se o problema acontece em vários canais ou apenas em um.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "los-vermelho",
    title: "Sinal LOS vermelho: o que significa e o que NÃO fazer",
    description:
      "Atenção máxima: cabo de fibra é frágil. Veja o que esperar do nosso atendimento.",
    keywords: ["los vermelho", "perda de sinal", "fibra rompida"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A luz <strong>LOS vermelha</strong> indica perda de sinal óptico. Pode ser:
        </p>
        <ul>
          <li>Cabo de fibra dobrado ou pisado dentro de casa;</li>
          <li>Conector solto na ONU;</li>
          <li>Rompimento na rua (poste, queda de árvore, obras);</li>
          <li>Manutenção em andamento na sua região.</li>
        </ul>

        <HelpCallout variant="danger" title="O que NÃO fazer">
          <ul>
            <li>Não desconecte o cabo verde da ONU — o conector é delicado e pode quebrar;</li>
            <li>Não dobre o cabo (raio mínimo de 3 cm);</li>
            <li>Não use álcool ou panos para limpar conectores ópticos;</li>
            <li>Não tente reconectar fibras rompidas (são finas como cabelo).</li>
          </ul>
        </HelpCallout>

        <h2 id="o-que-fazer">O que fazer</h2>
        <ol>
          <li>Verifique se o cabo dentro de casa está intacto e não foi puxado por crianças, pets ou móveis;</li>
          <li>Caso esteja visualmente OK, abra chamado pelo WhatsApp ou pelo 0800 721 0179;</li>
          <li>Em caso de rompimento confirmado, atendemos em até 24h conforme regulamentação Anatel.</li>
        </ol>
      </>
    ),
  },
];

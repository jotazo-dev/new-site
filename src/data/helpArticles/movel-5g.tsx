import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const movel5gArticles: HelpArticle[] = [
  {
    slug: "o-que-e-5g",
    title: "O que é 5G e a diferença para 4G/4.5G",
    description:
      "Entenda a quinta geração de internet móvel, suas vantagens, mitos e o que muda na prática.",
    keywords: ["5g", "4g", "4.5g", "diferença"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          O <strong>5G</strong> é a quinta geração de tecnologia móvel. Mais que velocidade,
          ele entrega <strong>baixíssima latência</strong>, <strong>maior densidade</strong>
          (mais aparelhos por área) e abre caminho para aplicações como carros conectados,
          telemedicina e indústria 4.0.
        </p>

        <h2 id="comparativo">Comparativo de gerações</h2>
        <table>
          <thead>
            <tr>
              <th>Geração</th>
              <th>Velocidade típica</th>
              <th>Latência</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>4G</td><td>10–50 Mbps</td><td>50–80 ms</td></tr>
            <tr><td>4.5G (LTE-A)</td><td>50–150 Mbps</td><td>30–50 ms</td></tr>
            <tr><td>5G NSA</td><td>200–600 Mbps</td><td>15–30 ms</td></tr>
            <tr><td>5G SA (Standalone)</td><td>400 Mbps – 1 Gbps</td><td>1–10 ms</td></tr>
          </tbody>
        </table>

        <h2 id="diferencas-praticas">O que muda na prática</h2>
        <ul>
          <li>Vídeo 4K sem buffering em qualquer lugar com sinal;</li>
          <li>Cloud gaming (jogar pela nuvem) viável;</li>
          <li>Videochamadas com qualidade de internet fixa;</li>
          <li>Downloads quase instantâneos.</li>
        </ul>

        <HelpCallout variant="info" title="5G no Vale do Ribeira">
          A Jotazo opera como MVNO sobre a infraestrutura 5G de operadora autorizada. A cobertura
          5G está em expansão na região. Confira em <a href="/cobertura">cobertura</a>.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "movel-5g", articleSlug: "ativar-5g-celular" },
      { categorySlug: "movel-5g", articleSlug: "cobertura-5g" },
    ],
  },
  {
    slug: "cobertura-5g",
    title: "Cobertura 5G no Vale do Ribeira",
    description:
      "Como verificar a cobertura 5G na sua região e o que esperar nas áreas em expansão.",
    keywords: ["cobertura", "5g", "apiaí", "vale do ribeira"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A cobertura 5G no interior cresce a cada mês. O Vale do Ribeira está sendo gradualmente
          atendido conforme a infraestrutura é instalada nas torres parceiras.
        </p>

        <h2 id="verificar">Como verificar</h2>
        <ol>
          <li>Acesse a página <a href="/cobertura">Cobertura</a>;</li>
          <li>Digite seu CEP completo;</li>
          <li>Selecione "Internet Móvel 5G";</li>
          <li>O resultado mostra se há sinal 5G, 4.5G ou 4G na sua área.</li>
        </ol>

        <h2 id="sem-5g">Estou em região sem 5G ainda</h2>
        <p>
          Não se preocupe: o chip Jotazo opera automaticamente em 4.5G/4G nessas áreas e migra
          para 5G assim que estiver disponível, sem necessidade de troca de chip.
        </p>

        <HelpCallout variant="tip">
          Cadastre-se em "Avise-me quando tiver 5G" no resultado da consulta para receber e-mail
          assim que sua região for ativada.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "movel-5g", articleSlug: "o-que-e-5g" },
      { categorySlug: "movel-5g", articleSlug: "ativar-5g-celular" },
    ],
  },
  {
    slug: "ativar-5g-celular",
    title: "Como ativar o 5G no celular (iOS e Android)",
    description:
      "Passo a passo para garantir que seu celular esteja navegando em 5G quando houver cobertura.",
    keywords: ["ativar 5g", "configurar", "iphone", "android"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <h2 id="requisitos">Requisitos</h2>
        <ul>
          <li>Aparelho compatível com 5G (a partir do iPhone 12 / Galaxy S20 / Moto Edge etc.);</li>
          <li>Chip 5G da Jotazo ativo;</li>
          <li>Estar em área com cobertura 5G.</li>
        </ul>

        <h2 id="iphone">No iPhone</h2>
        <ol>
          <li>Abra <strong>Ajustes → Celular → Opções de Dados Móveis</strong>;</li>
          <li>Toque em <strong>Voz e Dados</strong>;</li>
          <li>Selecione <strong>5G Automático</strong> (recomendado) ou <strong>5G Ativado</strong>.</li>
        </ol>

        <h2 id="android">No Android</h2>
        <ol>
          <li>Abra <strong>Configurações → Conexões → Redes móveis</strong>;</li>
          <li>Toque em <strong>Modo de rede</strong>;</li>
          <li>Selecione <strong>5G/LTE/3G/2G (conexão automática)</strong>.</li>
        </ol>
        <p className="text-xs">
          Os caminhos podem variar conforme fabricante (Samsung, Xiaomi, Motorola, etc.).
        </p>

        <HelpCallout variant="warning" title="Não aparece 5G?">
          <ul>
            <li>Reinicie o celular;</li>
            <li>Verifique se o chip está bem encaixado;</li>
            <li>Atualize o sistema operacional;</li>
            <li>Confirme se há cobertura 5G na sua região.</li>
          </ul>
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "movel-5g", articleSlug: "configurar-apn" },
      { categorySlug: "movel-5g", articleSlug: "volte-wifi-calling" },
    ],
  },
  {
    slug: "configurar-apn",
    title: "APN: como configurar manualmente",
    description:
      "O que é APN e como configurar caso seu celular não acesse a internet automaticamente.",
    keywords: ["apn", "configurar", "internet móvel"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          APN (<em>Access Point Name</em>) é o nome do ponto de acesso que seu celular usa para
          conectar à internet móvel. Em 99% dos casos é configurado automaticamente. Quando não é,
          basta inserir manualmente.
        </p>

        <h2 id="dados">Dados da APN Jotazo</h2>
        <table>
          <tbody>
            <tr><td><strong>Nome</strong></td><td>Jotazo</td></tr>
            <tr><td><strong>APN</strong></td><td>jotazo.com.br</td></tr>
            <tr><td><strong>Tipo de APN</strong></td><td>default,supl</td></tr>
            <tr><td><strong>Tipo de autenticação</strong></td><td>Nenhum</td></tr>
            <tr><td><strong>Protocolo APN</strong></td><td>IPv4/IPv6</td></tr>
          </tbody>
        </table>

        <h2 id="onde">Onde configurar</h2>
        <ul>
          <li><strong>Android:</strong> Configurações → Conexões → Redes móveis → Nomes de pontos de acesso → Adicionar.</li>
          <li><strong>iPhone:</strong> Ajustes → Celular → Rede de dados móveis.</li>
        </ul>

        <HelpCallout variant="info">
          Após salvar, selecione a nova APN na lista e reinicie o celular. Em poucos segundos a
          conexão deve voltar a funcionar.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "movel-5g", articleSlug: "ativar-5g-celular" },
    ],
  },
  {
    slug: "volte-wifi-calling",
    title: "VoLTE e Wi-Fi Calling: como ativar",
    description:
      "Faça e receba chamadas com qualidade HD, mesmo onde o sinal é fraco.",
    keywords: ["volte", "wifi calling", "chamadas", "hd voice"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="volte">O que é VoLTE</h2>
        <p>
          VoLTE (<em>Voice over LTE</em>) é a tecnologia que permite fazer chamadas pela rede 4G,
          mantendo a internet ativa durante a ligação e com qualidade <strong>HD Voice</strong>
          (áudio nítido e sem ruído).
        </p>

        <h2 id="wifi-calling">O que é Wi-Fi Calling</h2>
        <p>
          Permite fazer e receber chamadas pelo <strong>Wi-Fi da sua casa ou trabalho</strong>,
          ideal quando o sinal celular é fraco em ambientes fechados.
        </p>

        <h2 id="ativar">Como ativar</h2>
        <ul>
          <li><strong>iPhone:</strong> Ajustes → Celular → Chamadas no Wi-Fi → Ativar.</li>
          <li><strong>Android:</strong> Configurações → Conexões → Wi-Fi Calling → Ativar.</li>
        </ul>

        <HelpCallout variant="tip">
          Wi-Fi Calling é especialmente útil em regiões rurais ou em prédios com paredes grossas.
          Use seu Wi-Fi Jotazo de fibra para chamadas perfeitas, mesmo sem sinal de celular.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "portabilidade-numero",
    title: "Portabilidade do número: passo a passo",
    description:
      "Traga seu número antigo para a Jotazo sem perder seus contatos e gratuitamente.",
    keywords: ["portabilidade", "trocar operadora", "manter número"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A portabilidade é um direito do consumidor regulamentado pela Anatel. É gratuita,
          rápida e você não precisa avisar a operadora antiga.
        </p>

        <h2 id="passos">Passo a passo</h2>
        <ol>
          <li>Contrate um chip Jotazo pelo site ou loja física;</li>
          <li>No formulário, marque "Quero trazer meu número";</li>
          <li>Informe o número, operadora atual e CPF do titular;</li>
          <li>Aguarde 1 a 3 dias úteis para a transferência;</li>
          <li>Você recebe um SMS confirmando o início da portabilidade;</li>
          <li>Quando o chip antigo perder sinal, encaixe o chip Jotazo e reinicie o celular.</li>
        </ol>

        <HelpCallout variant="warning" title="Importante">
          Não cancele a linha antiga antes da portabilidade ser concluída. Se cancelar, o número é
          devolvido ao pool da Anatel e pode ser perdido.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "recargas-pacotes",
    title: "Recarga, pacotes adicionais e bônus",
    description:
      "Como recarregar, comprar pacotes extras de dados e aproveitar bônus de fim de ciclo.",
    keywords: ["recarga", "pacote", "bônus", "dados"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="recarregar">Como recarregar</h2>
        <ul>
          <li><strong>App Jotazo</strong> — opção mais rápida, com Pix em segundos;</li>
          <li><strong>Site Jotazo</strong> → Recarga;</li>
          <li><strong>Casas lotéricas</strong> e supermercados parceiros;</li>
          <li><strong>Banco</strong> via app dos principais bancos.</li>
        </ul>

        <h2 id="pacotes">Pacotes adicionais</h2>
        <p>
          Acabaram os GBs antes do fim do ciclo? Pacotes a partir de R$ 9,90 dão de 2 GB a 20 GB
          com validade de 7 a 30 dias.
        </p>

        <h2 id="bonus">Bônus por uso</h2>
        <p>
          Clientes ativos recebem mensalmente bônus para apps de música e streaming, além de SMS
          ilimitado entre clientes Jotazo.
        </p>
      </>
    ),
  },
];

# 📊 Dashboard de Desconexão de Rastreadores

Um dashboard web moderno, limpa e de alta performance, desenvolvido para atuar como um **Control Center** operacional. O projeto monitora e consolida dados de desconexão de rastreadores diretamente de uma base do Google Planilhas através de uma arquitetura de API assíncrona.

## 🚀 Funcionalidades Principais

* **Conexão em Tempo Real:** Integração direta com o Google Sheets utilizando o Google Apps Script como uma API REST (retornando JSON).
* **Atualização Automática (Auto-Refresh):** Timer regressivo configurável que recarrega os dados em background a cada 60 segundos sem necessidade de F5.
* **Indicador de Status (Heartbeat):** Monitoramento visual na Navbar que indica se a aplicação está conectada com sucesso à API do Google.
* **Interface Fixa (No-Scroll Geral):** Layout adaptado para telas de monitoramento (TVs/Monitores), onde apenas as tabelas e listas possuem rolagem interna independente.
* **Ordenação Inteligente:** Listagem de cidades gerada dinamicamente e organizada de forma decrescente (do maior volume de desconexões para o menor).
* **Design Moderno & Efeito Watermark:** Cards de KPI elegantes com efeito de esmaecimento (*fading/mask-image*) para as bandeiras regionais de fundo.

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (CSS Grid, Flexbox, Advanced Masking) e JavaScript Puro (Vanilla JS / Fetch API).
* **Backend:** Google Apps Script (GAS) atuando como microserviço de API e processamento de dados brutas.

## 📁 Estrutura do Projeto (VS Code)

```text
meu-dashboard/
├── img/
│   ├── default.png              # Imagem padrão para falhas de carregamento
│   ├── pato-branco-pr.png       # Exemplo de bandeira tratada
│   └── ...                      # Demais bandeiras (padrão: nome-uf.png)
├── index.html                   # Estrutura semântica do Dashboard
├── style.css                    # Estilização, variáveis de cores e responsividade
└── script.js                    # Consumo da API, tratamento de datas e lógica do timer

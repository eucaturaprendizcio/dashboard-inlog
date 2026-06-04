const URL_API_GAS = "https://script.google.com/macros/s/AKfycbzNxVAWISUGCU7rKvtSgDBWvUbPbUD349A1_fl9nrs-TbKrjJtEp-8fCR8EWuNhUYuB/exec";
const TEMPO_REFRESH_SEGUNDOS = 300;

let segundosRestantes = TEMPO_REFRESH_SEGUNDOS;
let intervaloTimer = null;

function formatarDataPlanilha(valor) {
    if (!valor) return "";
    if (typeof valor === "string" && valor.includes("T") && valor.includes("Z")) {
        const dataObjeto = new Date(valor);
        if (!isNaN(dataObjeto)) {
            return dataObjeto.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        }
    }
    return valor;
}

function obtenerUrlBandeira(nomeOriginal) {
    if (!nomeOriginal) return "img/default.png";
    let nomeTratado = nomeOriginal.toString().toLowerCase();
    nomeTratado = nomeTratado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    nomeTratado = nomeTratado.replace(/\s*\((\w+)\)/g, '-$1');
    nomeTratado = nomeTratado.replace(/\s+/g, '-');
    nomeTratado = nomeTratado.replace(/[^a-z0-9\-]/g, '');
    return "img/" + nomeTratado + ".png";
}

function carregarDadosDashboard() {
    const loader = document.getElementById('loader');

    fetch(URL_API_GAS)
        .then(res => res.json())
        .then(dados => {
            if (dados.erro) throw new Error(dados.erro);

            renderizarDashboard(dados);
            atualizarStatusConexao(true);
            resetarEIniciarTimer();
        })
        .catch(erro => {
            console.error("Erro na sincronização: ", erro);
            atualizarStatusConexao(false);
        })
        .finally(() => {
            if (loader) loader.classList.add('escondido');
        });
}

function atualizarStatusConexao(estaOnline) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (dot && text) {
        if (estaOnline) {
            dot.className = "dot online";
            text.innerText = "Conectado";
            text.style.color = "#10b981";
        } else {
            dot.className = "dot offline";
            text.innerText = "Erro de Conexão";
            text.style.color = "#ef4444";
        }
    }
}

function resetarEIniciarTimer() {
    clearInterval(intervaloTimer);
    segundosRestantes = TEMPO_REFRESH_SEGUNDOS;

    const timerText = document.getElementById('timer-text');
    if (timerText) timerText.innerText = `Atualizando em ${segundosRestantes}s`;

    intervaloTimer = setInterval(() => {
        segundosRestantes--;
        if (timerText) timerText.innerText = `Atualizando em ${segundosRestantes}s`;

        if (segundosRestantes <= 0) {
            clearInterval(intervaloTimer);
            if (timerText) timerText.innerText = "Atualizando...";
            carregarDadosDashboard();
        }
    }, 1000);
}

window.addEventListener('DOMContentLoaded', () => {
    carregarDadosDashboard();
});

// VARIÁVEL GLOBAL PARA GUARDAR OS ALERTAS DA ÚLTIMA CARGA
let dadosAlertasGlobais = [];

// Inicialização automática assim que o HTML termina de carregar
window.addEventListener('DOMContentLoaded', () => {
    carregarDadosDashboard();

    // OUVINTE DO INPUT: Filtra os cards sempre que o usuário digita algo
    const inputBusca = document.getElementById('input-busca-alertas');
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            const termoBusca = e.target.value.toLowerCase().trim();
            filtrarEExibirCards(termoBusca);
        });
    }
});

// Renderização dos dados principais na tela
function renderizarDashboard(dados) {
    // 1. KPIs do Header
    document.getElementById('kpi1-titulo').innerText = dados.kpi1.titulo;
    document.getElementById('kpi1-valor').innerText = dados.kpi1.valor;

    document.getElementById('kpi2-titulo').innerText = dados.kpi2.titulo;
    document.getElementById('kpi2-valor').innerText = dados.kpi2.valor;

    document.getElementById('kpi3-titulo').innerText = dados.kpi3.titulo;
    document.getElementById('kpi3-cidade').innerText = dados.kpi3.cidade;
    document.getElementById('kpi3-valor').innerText = "Quantidade: " + dados.kpi3.valor;
    if (dados.kpi3.cidade) {
        let img3 = document.getElementById('kpi3-flag');
        if (img3) {
            img3.src = obtenerUrlBandeira(dados.kpi3.cidade);
            img3.classList.remove('escondido');
        }
    }

    // 2. Cidades (A3:B)
    dados.cidades.sort((a, b) => Number(b.quantidade) - Number(a.quantidade));
    const listaCidadesContainer = document.getElementById('lista-cidades-container');
    listaCidadesContainer.innerHTML = "";

    dados.cidades.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card-cidade';
        card.innerHTML = `
            <img class="cidade-img" src="${obtenerUrlBandeira(item.cidade)}" onerror="this.src='img/default.png'; this.onerror=null;">
            <div class="cidade-nome">${item.cidade}</div>
            <div class="cidade-badge">${item.quantidade}</div>
        `;
        listaCidadesContainer.appendChild(card);
    });

    // 3. Tabela Geral (D6:H91)
    const tabelaHeader = document.getElementById('tabela-header');
    const tabelaBody = document.getElementById('tabela-body');
    tabelaHeader.innerHTML = "";
    tabelaBody.innerHTML = "";

    dados.tabela.headers.forEach(head => {
        const th = document.createElement('th');
        th.innerText = head || "";
        tabelaHeader.appendChild(th);
    });

    dados.tabela.rows.forEach(linha => {
        const tr = document.createElement('tr');
        linha.forEach(celula => {
            const td = document.createElement('td');
            td.innerText = formatarDataPlanilha(celula);
            tr.appendChild(td);
        });
        tabelaBody.appendChild(tr);
    });

    // 4. Salva os alertas na variável global e renderiza inicialmente
    dadosAlertasGlobais = dados.listaDestaques || (dados.destaqueInferior ? [dados.destaqueInferior] : []);

    // Reseta o valor do input de busca ao atualizar a página
    const inputBusca = document.getElementById('input-busca-alertas');
    if (inputBusca) inputBusca.value = "";

    filtrarEExibirCards(""); // Mostra todos logo na primeira carga

    // 1. Pega a lista de destaques (J6:L91) que veio da planilha
let listaItens = dados.listaDestaques || [];

let cidadeMaisCritica = "Nenhuma";
let maxDiasRegistro = 0;

// 2. Encontra o registro individual com o maior número de dias
listaItens.forEach(item => {
    let dias = Number(item.dias) || 0;
    if (dias > maxDiasRegistro) {
        maxDiasRegistro = dias;
        cidadeMaisCritica = item.cidade ? item.cidade.trim() : "Não informada";
    }
});

// 3. Joga o resultado desse registro recordista no Card 4 do HTML
document.getElementById('kpi4-cidade').innerText = cidadeMaisCritica;
document.getElementById('kpi4-valor').innerText = "Dias: " + maxDiasRegistro;
document.getElementById('kpi4-identificador').innerText = "Identificador: " + (listaItens.find(item => item.cidade === cidadeMaisCritica)?.identificador || "N/A");

// 4. Aplica a bandeira da cidade desse registro específico no fundo do card
if (cidadeMaisCritica !== "Nenhuma") {
    let img4 = document.getElementById('kpi4-flag');
    if (img4) {
        img4.src = obtenerUrlBandeira(cidadeMaisCritica);
        img4.classList.remove('escondido');
    }
}
}

// FUNÇÃO NOVA: Filtra a lista armazenada e renderiza apenas o que bater com a busca
function filtrarEExibirCards(termo) {
    const destaqueContainer = document.getElementById('destaque-container');
    destaqueContainer.innerHTML = "";

    // Filtra comparando com o Identificador ou com a Cidade
    const itensFiltrados = dadosAlertasGlobais.filter(item => {
        const id = (item.identificador || "").toString().toLowerCase();
        const cidade = (item.cidade || "").toString().toLowerCase();
        return id.includes(termo) || cidade.includes(termo);
    });

    if (itensFiltrados.length > 0) {
        itensFiltrados.forEach(item => {
            const cardAlerta = document.createElement('div');
            cardAlerta.className = 'card-alerta-individual';

            cardAlerta.innerHTML = `
                <div class="alerta-conteudo">
                    <span class="alerta-tag">🚨 Em Alerta</span>
                    <h2 class="alerta-id">${item.identificador || "Sem ID"}</h2>
                    <div class="alerta-detalhes">
                        <div class="alerta-col">
                            <span class="alerta-label">Última Conexão</span>
                            <span class="alerta-valor">${item.dias || 0} dias</span>
                        </div>
                        <div class="alerta-col divisor">
                            <span class="alerta-label">Cidade</span>
                            <span class="alerta-valor">${item.cidade || "Não informada"}</span>
                        </div>
                    </div>
                </div>
                <img class="alerta-bandeira-bg" src="${obtenerUrlBandeira(item.cidade)}" onerror="this.src='img/default.png'; this.onerror=null;">
            `;
            destaqueContainer.appendChild(cardAlerta);
        });
    } else {
        destaqueContainer.innerHTML = `<p style="color: var(--texto-sec); font-size: 0.9rem; padding: 10px; grid-column: 1/-1;">Nenhum equipamento corresponde à pesquisa.</p>`;
    }
}
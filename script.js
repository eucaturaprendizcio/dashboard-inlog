const URL_API_GAS = "https://script.google.com/macros/s/AKfycbzNxVAWISUGCU7rKvtSgDBWvUbPbUD349A1_fl9nrs-TbKrjJtEp-8fCR8EWuNhUYuB/exec";
const TEMPO_REFRESH_SEGUNDOS = 300; // Altere aqui o tempo de atualização automática

let segundosRestantes = TEMPO_REFRESH_SEGUNDOS;
let intervaloTimer = null;

// Formata as strings feias de data que o Google envia
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

// Dispara a carga de dados
function carregarDadosDashboard() {
    // Não exibe o loader de tela cheia se for apenas um refresh em background
    const loader = document.getElementById('loader');
    if (loader.classList.contains('escondido') === false) {
        // Deixa visível na primeira carga
    }

    fetch(URL_API_GAS)
        .then(res => res.json())
        .then(dados => {
            if(dados.erro) throw new Error(dados.erro);
            
            renderizarDashboard(dados);
            atualizarStatusConexao(true); // Muda para VERDE
            resetarEIniciarTimer();       // Reinicia a contagem de 60s
        })
        .catch(erro => {
            console.error("Erro na sincronização: ", erro);
            atualizarStatusConexao(false); // Muda para VERMELHO
        })
        .finally(() => {
            document.getElementById('loader').classList.add('escondido');
        });
}

// Controla visualmente a bolinha e o texto de conexão
function atualizarStatusConexao(estaOnline) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

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

// Gerencia a contagem regressiva do timer
function resetarEIniciarTimer() {
    clearInterval(intervaloTimer); // Limpa loops anteriores para não duplicar
    segundosRestantes = TEMPO_REFRESH_SEGUNDOS;
    
    const timerText = document.getElementById('timer-text');
    timerText.innerText = `Atualizando em ${segundosRestantes}s`;

    intervaloTimer = setInterval(() => {
        segundosRestantes--;
        timerText.innerText = `Atualizando em ${segundosRestantes}s`;

        if (segundosRestantes <= 0) {
            clearInterval(intervaloTimer);
            timerText.innerText = "Atualizando...";
            carregarDadosDashboard(); // Executa o refresh automático
        }
    }, 1000);
}

// Inicialização da página
window.addEventListener('DOMContentLoaded', () => {
    carregarDadosDashboard();
});

function renderizarDashboard(dados) {
    // 1. KPIs do Header
    document.getElementById('kpi1-titulo').innerText = dados.kpi1.titulo;
    document.getElementById('kpi1-valor').innerText = dados.kpi1.valor;

    document.getElementById('kpi2-titulo').innerText = dados.kpi2.titulo;
    document.getElementById('kpi2-valor').innerText = dados.kpi2.valor;

    document.getElementById('kpi3-titulo').innerText = dados.kpi3.titulo;
    document.getElementById('kpi3-cidade').innerText = dados.kpi3.cidade;
    document.getElementById('kpi3-valor').innerText = "Quantidade: " + dados.kpi3.valor;
    if(dados.kpi3.cidade) {
        let img3 = document.getElementById('kpi3-flag');
        img3.src = obtenerUrlBandeira(dados.kpi3.cidade);
        img3.classList.remove('escondido');
    }

    // 2. Ordenação Decrescente da Lista de Cidades
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

    // 3. Tabela Geral
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
}
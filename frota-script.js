const URL_API = "https://script.google.com/macros/s/AKfycbwgKrGaW1qBsqB-A1To2t3_krMyBtqJy-yPaF5Yz5crUymFdCmGcD6K1BKXt1CXVswmEw/exec";

async function fetchFrota() {
    try {
        const response = await fetch(URL_API);
        const data = await response.json();
        renderDashboard(data);
    } catch (err) {
        console.error("Erro ao carregar:", err);
    } finally {
        document.getElementById('loader').classList.add('hidden');
    }
}

function renderDashboard(data) {
    // KPIs
    const k = data.kpis;
    fillKpi('total', k.total);
    fillKpi('retidos', k.retidos);
    fillKpi('ativos', k.ativos);
    fillKpi('manutencao', k.manutencao);
    fillKpi('leiloados', k.leiloados);

    // Tabela
    const head = document.getElementById('tab-head');
    const body = document.getElementById('tab-body');

    // Headers
    data.tabela.headers.forEach(h => {
        head.innerHTML += `<th>${h || '-'}</th>`;
    });

    // Rows
    data.tabela.rows.forEach(row => {
        let tr = '<tr>';
        row.forEach((cell, index) => {
            let content = cell;

            // Se estiver vazio
            if (content === "" || content === null) {
                content = "-";
            } else {
                // Formatação específica de Colunas
                // B=0, C=1, D=2, E=3, F=4 (Data/Hora), G=5, H=6, I=7, J=8 (Data)
                if (index === 4) content = formatDataHora(cell);
                if (index === 8) content = formatDataSimples(cell);
            }
            
            tr += `<td>${content}</td>`;
        });
        tr += '</tr>';
        body.innerHTML += tr;
    });
}

function fillKpi(id, obj) {
    document.getElementById(`tit-${id}`).innerText = obj.titulo || '-';
    document.getElementById(`val-${id}`).innerText = obj.valor !== "" ? obj.valor : '0';
}

function formatDataHora(val) {
    if(!val || val === "-") return "-";
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleString('pt-BR');
}

function formatDataSimples(val) {
    if(!val || val === "-") return "-";
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString('pt-BR');
}

window.onload = fetchFrota;
/* Configuração do projeto: preencher a partir do briefing.md.
   IDs vazios = nenhum script de terceiros é carregado e o banner de cookies não aparece. */
const CONFIG = {
  ga4Id: 'G-2L0HZTKZH5',
  metaPixelId: '', // ex.: '123456789012345'
};

const CHAVE_CONSENTIMENTO = 'ul-consentimento';

// data-track → eventos disparados (ver _docs/padrao-whatsapp.md)
const EVENTOS = {
  whatsapp: { ga: 'generate_lead', gaParams: { method: 'whatsapp' }, meta: 'Contact' },
  instagram: { ga: 'click_instagram' },
  'avaliar-google': { ga: 'click_avaliar_google' },
  'como-chegar': { ga: 'click_como_chegar', meta: 'FindLocation' },
  'ifood-cliente': { ga: 'click_ifood_cliente' },
};

let analyticsCarregado = false;

// Consent Mode v2: os 4 sinais seguem juntos a escolha do banner
function sinaisConsentimento(aceito) {
  const valor = aceito ? 'granted' : 'denied';
  return { analytics_storage: valor, ad_storage: valor, ad_user_data: valor, ad_personalization: valor };
}

function lerConsentimento() {
  try {
    return localStorage.getItem(CHAVE_CONSENTIMENTO);
  } catch {
    return null;
  }
}

function salvarConsentimento(valor) {
  try {
    localStorage.setItem(CHAVE_CONSENTIMENTO, valor);
  } catch {
    // Sem armazenamento (aba anônima restrita): vale só para esta visita.
  }
  if (window.gtag) window.gtag('consent', 'update', sinaisConsentimento(valor === 'aceito'));
}

function carregarAnalytics() {
  if (analyticsCarregado) return;
  analyticsCarregado = true;

  // GA4: a tag já vem no <head> com consentimento negado; aqui só libera os cookies.
  if (CONFIG.ga4Id && window.gtag) {
    window.gtag('consent', 'update', sinaisConsentimento(true));
  }

  if (CONFIG.metaPixelId) {
    /* Snippet oficial do Meta Pixel */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CONFIG.metaPixelId);
    window.fbq('track', 'PageView');
  }
}

function iniciarConsentimento() {
  const usaAnalytics = Boolean(CONFIG.ga4Id || CONFIG.metaPixelId);
  const banner = document.getElementById('consentimento');
  const botoesAbrir = document.querySelectorAll('[data-abrir-consentimento]');

  if (!usaAnalytics) {
    botoesAbrir.forEach((b) => (b.hidden = true));
    return;
  }

  const abrir = () => {
    if (!banner) return;
    banner.hidden = false;
    document.body.classList.add('consentimento-aberto');
  };
  const fechar = () => {
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove('consentimento-aberto');
  };

  const escolha = lerConsentimento();
  if (escolha === 'aceito') carregarAnalytics();
  else if (!escolha) abrir();

  banner?.querySelector('[data-consentimento="aceitar"]')?.addEventListener('click', () => {
    salvarConsentimento('aceito');
    fechar();
    carregarAnalytics();
  });

  banner?.querySelector('[data-consentimento="recusar"]')?.addEventListener('click', () => {
    salvarConsentimento('recusado');
    fechar();
    // O Meta Pixel já carregado só sai da página com um recarregamento (o GA4 já foi atualizado acima).
    if (analyticsCarregado && CONFIG.metaPixelId) location.reload();
  });

  botoesAbrir.forEach((b) => b.addEventListener('click', abrir));
}

function iniciarTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-track]');
    if (!link) return;
    const evento = EVENTOS[link.dataset.track];
    if (!evento) return;
    const origem = link.dataset.origem || '';
    // GA4 respeita o Consent Mode sozinho (sem aceite, envia só sinais sem cookies)
    if (window.gtag && evento.ga) window.gtag('event', evento.ga, { ...evento.gaParams, origem });
    if (analyticsCarregado && window.fbq && evento.meta) window.fbq('track', evento.meta, { origem });
  });
}

/* Galeria com "Ver mais": sem JS a grade aparece completa; com JS mostra as 6 primeiras. */
function iniciarGaleria() {
  document.querySelectorAll('[data-galeria-grade]').forEach((grade) => {
    const botao = document.querySelector(`[data-galeria-mais="${grade.id}"]`);
    if (!botao) return;
    grade.classList.add('galeria-recolhida');
    botao.hidden = false;
    botao.addEventListener('click', () => {
      grade.classList.remove('galeria-recolhida');
      botao.hidden = true;
    });
  });
}

iniciarConsentimento();
iniciarTracking();
iniciarGaleria();

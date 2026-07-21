// Cache för alla översättningar
const translationsCache = {};

// Ladda alla språkfiler vid start
async function loadAllTranslations() {
  const languages = ['en', 'se', 'fi'];
  try {
    await Promise.all(
      languages.map(async (lang) => {
        try {
          const response = await fetch(`translations/${lang}.json`);
          if (!response.ok) {
            throw new Error(`Failed to load ${lang} translations: ${response.status}`);
          }
          translationsCache[lang] = await response.json();
        } catch (error) {
          console.error(`Error loading ${lang}:`, error);
        }
      })
    );
    applyTranslations('en');
  } catch (error) {
    console.error('Error in loadAllTranslations:', error);
  }
}

// Tillämpa översättningar
function applyTranslations(lang) {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translationsCache[lang] && translationsCache[lang][key]) {
      // Hantera <select>-element separat
      if (element.tagName === 'SELECT') {
        const options = element.querySelectorAll('option');
        options.forEach(option => {
          const optionKey = option.getAttribute('data-i18n');
          if (translationsCache[lang] && translationsCache[lang][optionKey]) {
            option.textContent = translationsCache[lang][optionKey];
          }
        });
      } else {
        element.textContent = translationsCache[lang][key];
      }
    }
  });
}

// Sätt språk
function setLanguage(lang) {
  applyTranslations(lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    }
  });
}

// Initiera
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllTranslations();

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.getAttribute('data-lang'));
    });
  });
});
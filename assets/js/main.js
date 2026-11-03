/* Хитров · кровельные работы · интерфейс */
(function () {
  'use strict';

  var CONFIG = {
    phone: '+375336704919',
    whatsapp: '375336704919',
    // Куда отправлять заявку: endpoint Formspree / CRM / свой скрипт.
    // Пусто — работает связка «позвонить / WhatsApp».
    formEndpoint: ''
  };

  var header = document.getElementById('header');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var fab = document.getElementById('fab');

  /* ---------- Шапка и кнопка звонка ---------- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (fab) fab.classList.toggle('is-visible', y > window.innerHeight * 0.7);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
    }
    document.body.classList.remove('nav-locked');
  }

  function openMenu() {
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    if (burger) {
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Закрыть меню');
    }
    document.body.classList.add('nav-locked');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      if (menu && menu.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
  }

  if (menu) {
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1080) closeMenu();
  });

  /* ---------- Плавный скролл с отступом под шапку ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Подсветка активного пункта ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Год в подвале ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Форма ---------- */
  var form = document.getElementById('zayavka-form');
  if (!form) return;

  var success = document.getElementById('form-success');
  var waLink = document.getElementById('success-wa');
  var callLink = document.getElementById('success-call');

  function setError(name, message) {
    var field = form.querySelector('[data-error-for="' + name + '"]');
    if (field) field.textContent = message || '';
    var input = form.querySelector('[name="' + name + '"]');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function digits(value) {
    return (value || '').replace(/\D/g, '');
  }

  function validate() {
    var ok = true;
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();

    if (name.length < 2) {
      setError('name', 'Как к вам обращаться?');
      ok = false;
    } else {
      setError('name', '');
    }

    if (digits(phone).length < 9) {
      setError('phone', 'Проверьте номер: нужно не меньше 9 цифр');
      ok = false;
    } else {
      setError('phone', '');
    }

    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstError = form.querySelector('[aria-invalid="true"]');
      if (firstError) firstError.focus();
      return;
    }

    var data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      work: form.elements.work ? form.elements.work.value : '',
      place: form.elements.place ? form.elements.place.value.trim() : '',
      message: form.elements.message ? form.elements.message.value.trim() : ''
    };

    var text =
      'Заявка с сайта\n' +
      'Имя: ' + data.name + '\n' +
      'Телефон: ' + data.phone + '\n' +
      'Работы: ' + data.work + '\n' +
      (data.place ? 'Объект: ' + data.place + '\n' : '') +
      (data.message ? 'Детали: ' + data.message : '');

    if (waLink) waLink.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
    if (callLink) callLink.href = 'tel:' + CONFIG.phone;

    var submit = form.querySelector('.form__submit');

    function showSuccess() {
      if (success) success.hidden = false;
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Заявка сохранена';
      }
    }

    if (CONFIG.formEndpoint) {
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Отправляем…';
      }
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('request failed');
          showSuccess();
        })
        .catch(function () {
          if (submit) {
            submit.disabled = false;
            submit.textContent = 'Отправить заявку';
          }
          setError('phone', 'Не удалось отправить. Позвоните, пожалуйста.');
        });
    } else {
      showSuccess();
    }
  });
})();

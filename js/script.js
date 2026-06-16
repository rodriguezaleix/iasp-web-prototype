document.addEventListener('DOMContentLoaded', function () {

  /* Mobile menu toggle */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  var headerEl = document.querySelector('header');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      if (headerEl) headerEl.classList.toggle('menu-open', nav.classList.contains('open'));
      var icon = toggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when a link is clicked (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        var parentLi = link.closest('li');
        if (parentLi && parentLi.classList.contains('has-submenu') && window.innerWidth <= 980) {
          // Submenu toggle links don't close the whole mobile menu
          return;
        }
        nav.classList.remove('open');
        if (headerEl) headerEl.classList.remove('menu-open');
        var icon = toggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  /* Dropdown submenus */
  document.querySelectorAll('.has-submenu > a.nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth > 980) return; // desktop: hover-driven via CSS

      var parentLi = link.parentElement;
      var isOpen = parentLi.classList.contains('submenu-open');

      e.preventDefault();

      // Close any other open submenus
      document.querySelectorAll('.has-submenu.submenu-open').forEach(function (openLi) {
        if (openLi !== parentLi) openLi.classList.remove('submenu-open');
      });

      parentLi.classList.toggle('submenu-open', !isOpen);
    });
  });

  /* 3D tilt-on-hover for cards (desktop pointer only) */
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.why-card, .news-card, .number-card, .member-logo, .forest-card').forEach(function (card) {
      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(700px) rotateX(' + (-y * 8) + 'deg) rotateY(' + (x * 8) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* Sticky header shadow on scroll */
  var header = document.querySelector('header');
  if (header) {
    var updateHeaderScrolled = function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    updateHeaderScrolled();
    window.addEventListener('scroll', updateHeaderScrolled);
  }

  /* Reveal-on-scroll animations */
  var revealEls = document.querySelectorAll(
    '.why-card, .feature-item, .news-card, .stat, .member-logo, .number-card, .chip, .region-chip, .forest-card, .mission .container, .benefit-card, .who-card, .value-card, .access-list li'
  );
  var revealLeftEls = document.querySelectorAll(
    '.ecosystem-left, .structure-col:first-child'
  );
  var revealRightEls = document.querySelectorAll(
    '.ecosystem-image, .structure-col:last-child'
  );

  revealEls.forEach(function (el) {
    el.classList.add('reveal');
  });
  revealLeftEls.forEach(function (el) {
    el.classList.add('reveal-left');
  });
  revealRightEls.forEach(function (el) {
    el.classList.add('reveal-right');
  });

  var allRevealEls = Array.prototype.concat(
    Array.prototype.slice.call(revealEls),
    Array.prototype.slice.call(revealLeftEls),
    Array.prototype.slice.call(revealRightEls)
  );

  // Stagger siblings within the same grid/row so groups cascade in
  function staggerDelay(el) {
    var parent = el.parentElement;
    if (!parent) return 0;
    var index = Array.prototype.indexOf.call(parent.children, el);
    return Math.min(Math.max(index, 0), 5) * 90;
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var target = entry.target;
          setTimeout(function () {
            target.classList.add('visible');
          }, staggerDelay(target));
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.15 });

    allRevealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    allRevealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

/* Stats counter animation - fade in + smoother count */
var statsSection = document.querySelector('.stats');
var statItems = document.querySelectorAll('.stats .stat');
var statNumbers = document.querySelectorAll('.stats .num');
var statsAnimationStarted = false;

function getNumberData(text) {
  var cleanText = text.trim();
  var numberMatch = cleanText.match(/[\d,.]+/);
  var rawNumber = numberMatch ? numberMatch[0] : '0';
  var number = parseFloat(rawNumber.replace(',', '.'));
  var suffix = cleanText.replace(rawNumber, '');

  return {
    number: number,
    suffix: suffix,
    originalText: cleanText
  };
}

function animateStatNumber(element, index) {
  var data = getNumberData(element.textContent);
  var target = data.number;
  var suffix = data.suffix;
  var originalText = data.originalText;

  var startValue = Math.max(0, Math.floor(target * 0.72));
  var duration = 950 + index * 120;
  var delay = index * 140;

  var startTime = null;
  var lastValue = null;

  element.textContent = startValue + suffix;

  setTimeout(function () {
    function updateCounter(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Easing suave y elegante
      var easedProgress = 1 - Math.pow(1 - progress, 4);

      var currentValue = Math.round(
        startValue + (target - startValue) * easedProgress
      );

      if (currentValue !== lastValue) {
        element.textContent = currentValue + suffix;
        lastValue = currentValue;
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = originalText;
      }
    }

    requestAnimationFrame(updateCounter);
  }, delay);
}

function startStatsAnimation() {
  if (statsAnimationStarted) return;

  statsAnimationStarted = true;

  statItems.forEach(function (item, index) {
    setTimeout(function () {
      item.classList.add('visible');

      var number = item.querySelector('.num');
      if (number) {
        animateStatNumber(number, index);
      }
    }, index * 140);
  });
}

if (statsSection && statNumbers.length) {
  statItems.forEach(function (item) {
    item.classList.remove('visible');
  });

  if ('IntersectionObserver' in window) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startStatsAnimation();
          statsObserver.unobserve(statsSection);
        }
      });
    }, {
      threshold: 0.35
    });

    statsObserver.observe(statsSection);
  } else {
    startStatsAnimation();
  }
}

  /* "IASP in Numbers" counters (About page) */
  var numberCards = document.querySelectorAll('.number-card .num');

  if (numberCards.length) {
    if ('IntersectionObserver' in window) {
      var numbersObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var i = Array.prototype.indexOf.call(numberCards, entry.target);
            animateStatNumber(entry.target, Math.max(i, 0));
            numbersObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      numberCards.forEach(function (el) {
        numbersObserver.observe(el);
      });
    }
  }

  /* Organisational chart draw-in animation (About page) */
  var hubSvg = document.querySelector('.hub-svg');

  if (hubSvg) {
    if ('IntersectionObserver' in window) {
      var hubObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            hubObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      hubObserver.observe(hubSvg);
    } else {
      hubSvg.classList.add('in-view');
    }
  }

  /* Newsletter form */
  var form = document.querySelector('.newsletter-form');
  if (form) {
    var msg = document.createElement('p');
    msg.className = 'newsletter-msg';
    form.parentNode.appendChild(msg);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var input = form.querySelector('input[type="email"]');
      if (!input) return;

      var email = input.value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailPattern.test(email)) {
        msg.textContent = '¡Gracias por suscribirte!';
        msg.style.color = '#8be0a3';
        form.reset();
      } else {
        msg.textContent = 'Introduce un email válido.';
        msg.style.color = '#f4941e';
      }
    });
  }

  /* Smooth scroll for in-page anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');

      if (targetId.length > 1) {
        var target = document.querySelector(targetId);

        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

});
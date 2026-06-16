document.addEventListener('DOMContentLoaded', function () {

  var grid = document.getElementById('resourcesGrid');
  if (!grid) return; // Only run on the Knowledge Room page

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.resource-card'));
  var resultsCount = document.getElementById('resultsCount');
  var noResults = document.getElementById('noResults');
  var pagination = document.getElementById('pagination');
  var pageNumbers = document.getElementById('pageNumbers');
  var prevBtn = document.getElementById('prevPage');
  var nextBtn = document.getElementById('nextPage');
  var sortSelect = document.getElementById('sortSelect');
  var pageSize = 8;
  var currentPage = 1;

  /* ---------- Filter groups: expand / collapse ---------- */
  var filterGroups = document.querySelectorAll('.filter-group');
  var moreFiltersBtn = document.querySelector('.more-filters');
  var moreFiltersLabel = moreFiltersBtn ? moreFiltersBtn.querySelector('.more-filters-label') : null;

  function updateMoreFiltersLabel() {
    if (!moreFiltersLabel || !filterGroups.length) return;
    var allOpen = Array.prototype.every.call(filterGroups, function (g) {
      return g.classList.contains('open');
    });
    moreFiltersLabel.textContent = allOpen ? 'Hide all' : 'Show all';
  }

  filterGroups.forEach(function (group) {
    var toggle = group.querySelector('.filter-toggle');
    var options = group.querySelector('.filter-options');
    if (!toggle || !options) return;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () {
      var isOpen = group.classList.contains('open');
      group.classList.toggle('open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
      updateMoreFiltersLabel();
    });
  });

  /* "More Filters" expands / collapses every group at once */
  if (moreFiltersBtn) {
    moreFiltersBtn.addEventListener('click', function () {
      var allOpen = Array.prototype.every.call(filterGroups, function (g) {
        return g.classList.contains('open');
      });
      filterGroups.forEach(function (g) {
        g.classList.toggle('open', !allOpen);
        var t = g.querySelector('.filter-toggle');
        if (t) t.setAttribute('aria-expanded', String(!allOpen));
      });
      updateMoreFiltersLabel();
    });
  }

  /* ---------- Grid / List view toggle ---------- */
  var viewButtons = document.querySelectorAll('.view-toggle button');
  viewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      viewButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      grid.classList.toggle('list-view', btn.dataset.view === 'list');
    });
  });

  /* ---------- Helpers ---------- */
  function getCheckedValues(filterName) {
    return Array.prototype.slice
      .call(document.querySelectorAll('input[data-filter="' + filterName + '"]:checked'))
      .map(function (input) { return input.value; });
  }

  function matchesFilters(card) {
    var types = getCheckedValues('type');
    var topics = getCheckedValues('topic');
    var years = getCheckedValues('year');
    var prices = getCheckedValues('price');
    var discountInput = document.querySelector('input[data-filter="discount"]');

    if (types.length && types.indexOf(card.dataset.type) === -1) return false;

    if (topics.length) {
      var cardTopics = (card.dataset.topic || '').split(' ');
      var hasTopic = topics.some(function (t) { return cardTopics.indexOf(t) !== -1; });
      if (!hasTopic) return false;
    }

    if (years.length && years.indexOf(card.dataset.year) === -1) return false;

    if (prices.length) {
      var cardPriceType = card.dataset.price === '0' ? 'free' : 'paid';
      if (prices.indexOf(cardPriceType) === -1) return false;
    }

    if (discountInput && discountInput.checked && card.dataset.discount !== 'yes') return false;

    return true;
  }

  function sortCards(list) {
    var sortValue = sortSelect ? sortSelect.value : 'popular';
    var sorted = list.slice();

    if (sortValue === 'newest') {
      sorted.sort(function (a, b) { return parseInt(b.dataset.year, 10) - parseInt(a.dataset.year, 10); });
    } else if (sortValue === 'price-asc') {
      sorted.sort(function (a, b) { return parseInt(a.dataset.price, 10) - parseInt(b.dataset.price, 10); });
    } else if (sortValue === 'price-desc') {
      sorted.sort(function (a, b) { return parseInt(b.dataset.price, 10) - parseInt(a.dataset.price, 10); });
    }
    /* 'popular' = keep the original catalogue order */

    return sorted;
  }

  function scrollToResults() {
    var head = document.querySelector('.resources-head');
    if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Render ---------- */
  function render() {
    var filtered = cards.filter(matchesFilters);
    var sorted = sortCards(filtered);

    var totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * pageSize;
    var pageItems = sorted.slice(start, start + pageSize);

    // Hide everything, then re-append + show only the current page's items
    cards.forEach(function (c) { c.style.display = 'none'; });
    pageItems.forEach(function (card) {
      grid.appendChild(card);
      card.style.display = '';
    });

    if (resultsCount) resultsCount.textContent = '(' + sorted.length + ')';
    if (noResults) noResults.style.display = sorted.length ? 'none' : 'block';
    grid.style.display = sorted.length ? '' : 'none';

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!pageNumbers) return;
    pageNumbers.innerHTML = '';

    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = String(i);
      btn.addEventListener('click', (function (page) {
        return function () {
          currentPage = page;
          render();
          scrollToResults();
        };
      })(i));
      pageNumbers.appendChild(btn);
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pagination) pagination.style.display = totalPages <= 1 ? 'none' : 'flex';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage--;
        render();
        scrollToResults();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      currentPage++;
      render();
      scrollToResults();
    });
  }

  /* ---------- Filter checkboxes ---------- */
  document.querySelectorAll('.filter-options input').forEach(function (input) {
    input.addEventListener('change', function () {
      currentPage = 1;
      render();
    });
  });

  /* ---------- Sort ---------- */
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      currentPage = 1;
      render();
    });
  }

  /* ---------- Clear all ---------- */
  var clearAll = document.querySelector('.clear-all');
  if (clearAll) {
    clearAll.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.filter-options input').forEach(function (input) {
        input.checked = false;
      });
      if (sortSelect) sortSelect.value = 'popular';
      currentPage = 1;
      render();
    });
  }

  render();

  /* ---------- Popular Resources carousel ---------- */
  var popularGrid = document.querySelector('.popular-resources .resource-grid');
  var prevCarousel = document.querySelector('.carousel-prev');
  var nextCarousel = document.querySelector('.carousel-next');

  if (popularGrid && (prevCarousel || nextCarousel)) {
    function scrollStep() {
      var card = popularGrid.querySelector('.resource-card');
      var gap = parseFloat(getComputedStyle(popularGrid).gap) || 24;
      return card ? card.getBoundingClientRect().width + gap : popularGrid.clientWidth;
    }

    function updateCarouselButtons() {
      var maxScroll = popularGrid.scrollWidth - popularGrid.clientWidth;
      if (prevCarousel) prevCarousel.disabled = popularGrid.scrollLeft <= 1;
      if (nextCarousel) nextCarousel.disabled = popularGrid.scrollLeft >= maxScroll - 1;
    }

    if (prevCarousel) {
      prevCarousel.addEventListener('click', function () {
        popularGrid.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
      });
    }

    if (nextCarousel) {
      nextCarousel.addEventListener('click', function () {
        popularGrid.scrollBy({ left: scrollStep(), behavior: 'smooth' });
      });
    }

    popularGrid.addEventListener('scroll', updateCarouselButtons);
    window.addEventListener('resize', updateCarouselButtons);
    updateCarouselButtons();
  }
});

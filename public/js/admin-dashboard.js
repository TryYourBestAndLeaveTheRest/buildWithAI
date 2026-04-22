document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize data from JSON script tag
  const adminDataEl = document.getElementById('admin-data');
  const initialData = adminDataEl ? JSON.parse(adminDataEl.textContent || '{}') : {};

  const state = {
    resource: initialData.resource || 'users',
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    order: 'desc',
    filter: {},
    total: initialData.total || 0,
    totalPages: Math.ceil((initialData.total || 0) / 10)
  };

  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const searchInput = document.getElementById('dataSearch');
  const sortBySelect = document.getElementById('sortBy');
  const sortOrderSelect = document.getElementById('sortOrder');
  const refreshBtn = document.getElementById('refreshData');
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageNumbers = document.getElementById('pageNumbers');
  const pageStartSpan = document.getElementById('pageStart');
  const pageEndSpan = document.getElementById('pageEnd');
  const totalRecordsSpan = document.getElementById('totalRecords');

  // Initialize UI
  applyPageViewBars();
  updateTableHeaders();
  updatePaginationUI();

  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active', 'bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-500', 'hover:text-slate-800');
      });
      btn.classList.add('active', 'bg-white', 'text-slate-900', 'shadow-sm');
      btn.classList.remove('text-slate-500', 'hover:text-slate-800');
      
      state.resource = btn.dataset.resource;
      state.page = 1;
      updateTableHeaders();
      fetchData();
    });
  });

  // Search with Debounce
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.search = e.target.value;
      state.page = 1;
      fetchData();
    }, 500);
  });

  // Sort Changes
  sortBySelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    fetchData();
  });

  sortOrderSelect.addEventListener('change', (e) => {
    state.order = e.target.value;
    fetchData();
  });

  // Refresh
  refreshBtn.addEventListener('click', fetchData);

  // Pagination Controls
  prevPageBtn.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      fetchData();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      fetchData();
    }
  });

  // Page Number Delegation (CSP Friendly)
  pageNumbers.addEventListener('click', (e) => {
    const pageItem = e.target.closest('[data-page]');
    if (pageItem) {
      const p = parseInt(pageItem.dataset.page);
      if (!isNaN(p) && p !== state.page) {
        state.page = p;
        fetchData();
      }
    }
  });

  async function fetchData() {
    try {
      tableBody.innerHTML = '<tr><td colspan="10" class="p-12 text-center text-slate-400 font-medium italic animate-pulse">Loading platform records...</td></tr>';
      
      const query = new URLSearchParams({
        page: state.page,
        limit: state.limit,
        search: state.search,
        sortBy: state.sortBy,
        order: state.order,
        filter: JSON.stringify(state.filter)
      });

      const response = await fetch(`/api/admin/data/${state.resource}?${query}`);
      const data = await response.json();

      state.total = data.total;
      state.totalPages = data.totalPages;
      
      renderTable(data.items);
      updatePaginationUI();
    } catch (error) {
      console.error('Error fetching data:', error);
      tableBody.innerHTML = '<tr><td colspan="10" class="p-12 text-center text-rose-500 font-bold">⚠️ Failed to load resource data</td></tr>';
    }
  }

  function applyPageViewBars() {
    document.querySelectorAll('.pageview-bar').forEach((el) => {
      const width = Number(el.getAttribute('data-width') || 0);
      el.style.width = `${Math.max(0, Math.min(100, width))}%`;
    });
  }

  function updateTableHeaders() {
    let headers = [];
    if (state.resource === 'users') {
      headers = ['User', 'Dorm', 'Joined', 'Role'];
    } else if (state.resource === 'listings') {
      headers = ['Title', 'Seller', 'Type', 'Status', 'Date'];
    } else if (state.resource === 'transactions') {
      headers = ['Listing', 'Parties', 'Status', 'Created'];
    }
    
    tableHead.innerHTML = headers.map(h => `<th class="p-4 text-left font-black tracking-widest text-[10px] uppercase text-slate-400">${h}</th>`).join('');
  }

  function renderTable(items) {
    if (!items || items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10" class="p-12 text-center text-slate-400 font-medium italic">No matching records found</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map(item => {
      if (state.resource === 'users') {
        const adminClass = item.isAdmin ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600';
        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-xs">${item.name.charAt(0)}</div>
                <div>
                  <span class="block font-bold text-slate-900 text-sm">${item.name}</span>
                  <span class="block text-[10px] text-slate-400 font-bold uppercase">${item.email}</span>
                </div>
              </div>
            </td>
            <td class="p-4 text-xs font-bold text-slate-600">${item.dorm || 'N/A'}</td>
            <td class="p-4 text-xs text-slate-400 font-bold">${new Date(item.createdAt).toLocaleDateString()}</td>
            <td class="p-4">
              <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${adminClass}">
                ${item.isAdmin ? 'Admin' : 'User'}
              </span>
            </td>
          </tr>
        `;
      } else if (state.resource === 'listings') {
        const typeClass = item.type === 'have' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';
        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-bold text-slate-900 text-sm">${item.title}</td>
            <td class="p-4 text-xs font-bold text-slate-600">${item.user?.name || 'Unknown'}</td>
            <td class="p-4">
              <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${typeClass}">${item.type}</span>
            </td>
            <td class="p-4">
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider">${item.status}</span>
            </td>
            <td class="p-4 text-xs text-slate-400 font-bold">${new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        `;
      } else if (state.resource === 'transactions') {
        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-bold text-slate-900 text-sm truncate max-w-[200px]">${item.listing?.title || 'Deleted Listing'}</td>
            <td class="p-4">
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-bold text-slate-700"><span class="text-slate-400 text-[9px] uppercase">S:</span> ${item.seller?.name || 'System'}</span>
                <span class="text-xs font-bold text-slate-700"><span class="text-slate-400 text-[9px] uppercase">B:</span> ${item.buyer?.name || 'System'}</span>
              </div>
            </td>
            <td class="p-4">
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-900 text-[9px] font-black uppercase tracking-wider border border-slate-200">${item.status}</span>
            </td>
            <td class="p-4 text-xs text-slate-400 font-bold">${new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        `;
      }
      return '';
    }).join('');
  }

  function updatePaginationUI() {
    pageStartSpan.textContent = state.total === 0 ? 0 : (state.page - 1) * state.limit + 1;
    pageEndSpan.textContent = Math.min(state.page * state.limit, state.total);
    totalRecordsSpan.textContent = state.total;
    
    prevPageBtn.disabled = state.page === 1;
    nextPageBtn.disabled = state.page >= state.totalPages;
    
    // Render page numbers
    let pagesHtml = '';
    const start = Math.max(1, state.page - 2);
    const end = Math.min(state.totalPages, state.page + 2);
    
    for (let i = start; i <= end; i++) {
      const activeClasses = i === state.page 
        ? 'bg-slate-900 text-white shadow-sm' 
        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200';
      pagesHtml += `<span class="w-8 h-8 flex items-center justify-center rounded text-xs font-bold cursor-pointer transition-all ${activeClasses}" data-page="${i}">${i}</span>`;
    }
    pageNumbers.innerHTML = pagesHtml;
  }
});

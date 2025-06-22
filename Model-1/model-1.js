<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<style>
  .arsip-container {
    font-family: 'Segoe UI', sans-serif;
    max-width: 1100px;
    margin: auto;
  }

  .arsip-controls {
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-between;
  }

  .arsip-search {
    flex: 1;
    padding: 8px;
    font-size: 1em;
  }

  .arsip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .arsip-card {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 20px;
    background: #fff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    position: relative;
  }

  .arsip-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  }

  .arsip-icon {
    font-size: 40px;
    color: #007bff;
    margin-bottom: 10px;
  }

  .arsip-title {
    font-weight: bold;
    font-size: 1.1em;
    margin-bottom: 5px;
    color: #333;
    min-height: 50px;
  }

  .arsip-meta {
    font-size: 0.9em;
    color: #555;
    margin-bottom: 10px;
    line-height: 1.4em;
  }

  .arsip-actions a {
    display: inline-block;
    margin-right: 8px;
    margin-top: 8px;
    padding: 6px 12px;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.85em;
  }

  .arsip-actions a:hover {
    background: #0056b3;
  }

  .arsip-pagination {
    text-align: center;
    margin-top: 25px;
  }

  .arsip-pagination button {
    padding: 8px 14px;
    margin: 0 5px;
    border: none;
    background: #eee;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
  }

  .arsip-pagination button.active {
    background: #007bff;
    color: white;
  }
</style>

<div class="arsip-container">
  <div class="arsip-controls">
    <input type="text" id="arsip-search" class="arsip-search" placeholder="🔍 Cari surat...">
    <select id="arsip-filter">
      <option value="all">Semua Jenis</option>
      <option value="Surat Masuk">Surat Masuk</option>
      <option value="Surat Keluar">Surat Keluar</option>
    </select>
  </div>

  <div id="arsip-grid" class="arsip-grid"></div>
  <div class="arsip-pagination" id="arsip-pagination"></div>
</div>

<script>
  const blogURL = "https://Nama-Blog-Kamu.blogspot.com";
  const arsipFeed = blogURL + "/feeds/posts/default/-/arsip?alt=json&max-results=100";

  let arsipData = [];
  let currentPage = 1;
  const itemsPerPage = 6;

  async function getPosts() {
    const res = await fetch(arsipFeed);
    const data = await res.json();
    return data.feed.entry || [];
  }

  function extractContent(entry) {
    const title = entry.title.$t;
    const content = entry.content.$t;

    const noSurat = /Nomor Surat:\s*(.*?)<br/i.exec(content)?.[1] || '-';
    const dari = /Surat Dari:\s*(.*?)<br/i.exec(content)?.[1] || '-';
    const uraian = /Uraian Singkat:\s*(.*?)<br/i.exec(content)?.[1] || '-';

    const labels = entry.category.map(cat => cat.term.toLowerCase());
    const jenis = labels.includes('surat masuk') ? 'Surat Masuk' :
                  labels.includes('surat keluar') ? 'Surat Keluar' : 'Lainnya';

    const previewMatch = /https:\/\/drive\.google\.com\/file\/d\/(.*?)\/view/i.exec(content);
    const fileId = previewMatch ? previewMatch[1] : null;

    const previewURL = fileId ? `https://drive.google.com/file/d/${fileId}/view` : '#';
    const downloadURL = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : '#';

    return {
      title, noSurat, dari, uraian, jenis, previewURL, downloadURL
    };
  }

  function renderGrid(data) {
    const grid = document.getElementById("arsip-grid");
    grid.innerHTML = "";
    data.forEach(item => {
      grid.innerHTML += `
        <div class="arsip-card">
          <div class="arsip-icon"><i class="fa-solid fa-file-lines"></i></div>
          <div class="arsip-title">${item.title}</div>
          <div class="arsip-meta">
            No Surat : <strong>${item.noSurat}</strong><br>
            Pengirim :  ${item.dari}<br>
            Uraian :  ${item.uraian}<br>
            Jenis : <em>${item.jenis}</em>
          </div>
          <div class="arsip-actions">
            <a href="${item.previewURL}" target="_blank"><i class="fa-solid fa-eye"></i> Preview</a>
            <a href="${item.downloadURL}" target="_blank"><i class="fa-solid fa-download"></i> Download</a>
          </div>
        </div>
      `;
    });
  }

  function renderPagination(totalItems) {
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById("arsip-pagination");
    container.innerHTML = "";

    for (let i = 1; i <= pageCount; i++) {
      container.innerHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
  }

  function changePage(page) {
    currentPage = page;
    applyFilters();
  }

  function applyFilters() {
    const keyword = document.getElementById("arsip-search").value.toLowerCase();
    const filterJenis = document.getElementById("arsip-filter").value;

    let filtered = arsipData.filter(item => {
      const cocokCari = item.title.toLowerCase().includes(keyword) ||
                        item.noSurat.toLowerCase().includes(keyword) ||
                        item.dari.toLowerCase().includes(keyword) ||
                        item.uraian.toLowerCase().includes(keyword);
      const cocokJenis = filterJenis === "all" || item.jenis === filterJenis;
      return cocokCari && cocokJenis;
    });

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    renderGrid(paginated);
    renderPagination(filtered.length);
  }

  getPosts().then(entries => {
    arsipData = entries.map(extractContent);
    applyFilters();
  });

  document.getElementById("arsip-search").addEventListener("input", () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById("arsip-filter").addEventListener("change", () => {
    currentPage = 1;
    applyFilters();
  });
</script>

// script.js (เวอร์ชันอัปเดตทั้งหมด)
document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENT SELECTORS ---
    const articlesContainer = document.getElementById("articles-container");
    const searchBox = document.getElementById("search-box");
    const addNewBtn = document.getElementById("add-new-article-btn");
    const backupBtn = document.getElementById("backup-btn");
    const restoreInput = document.getElementById("restore-input");
    const toast = document.getElementById("toast-notification");

    // Read Article Modal (New)
    const readArticleModal = document.getElementById("read-article-modal");
    const readModalTitle = document.getElementById("read-modal-title");
    const readModalContent = document.getElementById("read-modal-content");
    const readModalCloseBtn = document.getElementById("read-modal-close-btn");

    // Article Modal
    const modal = document.getElementById("article-modal");
    const modalTitle = document.getElementById("modal-title");
    const articleForm = document.getElementById("article-form");
    const articleIdInput = document.getElementById("article-id");
    const articleTitleInput = document.getElementById("article-title");
    const articleContentInput = document.getElementById("article-content");
    const cancelBtn = document.getElementById("cancel-btn");

    // Confirm Modal
    const confirmModal = document.getElementById("confirm-modal");
    const confirmMessage = document.getElementById("confirm-message");
    const confirmOkBtn = document.getElementById("confirm-ok");
    const confirmCancelBtn = document.getElementById("confirm-cancel");
    let confirmCallback = null;

    // --- QUICK LINKS ELEMENTS (ใหม่) ---
    const quickLinksContainer = document.getElementById("quick-links-container");
    const linkSaveBtn = document.getElementById("link-save-btn");
    const linkModal = document.getElementById("link-modal");
    const linkModalTitle = document.getElementById("link-modal-title");
    const linkForm = document.getElementById("link-form");
    const linkIdInput = document.getElementById("link-id");
    const linkTextInput = document.getElementById("link-text");
    const linkHrefInput = document.getElementById("link-href");
    const linkCancelBtn = document.getElementById("link-cancel-btn");

    // --- DATA VARIABLES ---
    let articles = [];
    let quickLinks = []; // (ใหม่) เพิ่มตัวแปรสำหรับเก็บ Quick Links

    // --- DATA MANAGEMENT (อัปเดต) ---
    async function loadData() {
        try {
            const response = await fetch("http://localhost:3000/load");
            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            articles = data.articles || [];
            quickLinks = data.quickLinks || [];

            if (articles.length === 0 && quickLinks.length === 0) {
                articles = [
                    {
                        id: Date.now(),
                        title: "ยินดีต้อนรับ!",
                        content: "นี่เป็นบทความเริ่มต้นของคุณ",
                        isPinned: false,
                        isExpanded: false,
                    },
                ];
                quickLinks = [
                    {
                        id: Date.now() + 1,
                        text: "Google",
                        href: "https://www.google.com",
                    },
                ];
                await saveData();
            }
        } catch (error) {
            console.error("ไม่สามารถโหลดข้อมูลจาก Server ได้:", error);
            alert(
                'ไม่สามารถโหลดข้อมูลจาก Server ได้ โปรดตรวจสอบว่าคุณรัน "node server.js" แล้วหรือยัง'
            );
            articles = [];
            quickLinks = [];
        }
    }

    async function saveData() {
        try {
            const dataToSave = { articles, quickLinks };
            const response = await fetch("http://localhost:3000/save", { // เพิ่ม response =
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSave),
            });

            // เพิ่มการตรวจสอบสถานะจาก Server
            if (!response.ok) {
                // ถ้า Server ตอบกลับว่ามีปัญหา ให้โยน Error
                throw new Error(`Server responded with status: ${response.status}`);
            }

            console.log("Data saved to server.");
            showToast("บันทึกข้อมูลลงไฟล์สำเร็จ!");
        } catch (error) {
            console.error("Failed to save data:", error);
            showToast("บันทึกข้อมูลล้มเหลว!");
        }
    }

    // --- UI FEEDBACK ---
    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove("opacity-0");
        setTimeout(() => toast.classList.add("opacity-0"), 3000);
    }

    function formatDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `แก้ไขล่าสุด: ${date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })} เวลา ${date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        })} น.`;
    }

    // --- RENDERING ---
    function renderArticles(query = '') {
        articlesContainer.innerHTML = '';
        const lowerCaseQuery = query.toLowerCase().trim();

        // 1. กรองบทความตามคำค้นหา
        const filteredArticles = lowerCaseQuery
            ? articles.filter(a => a.title.toLowerCase().includes(lowerCaseQuery) || a.content.toLowerCase().includes(lowerCaseQuery))
            : [...articles]; // ใช้ spread operator เพื่อสร้าง array ใหม่ ป้องกันการแก้ไข array ต้นฉบับ

        // 2. (ใหม่) เรียงลำดับบทความ
        filteredArticles.sort((a, b) => {
            // ปักหมุดสำคัญที่สุด
            if (a.isPinned !== b.isPinned) {
                return b.isPinned - a.isPinned;
            }
            // ถ้าปักหมุดเหมือนกัน ให้เรียงตามเวลาแก้ไขล่าสุด
            return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
        });

        if (filteredArticles.length === 0) {
            articlesContainer.innerHTML = `<div class="text-center text-gray-400 bg-gray-700 rounded-lg p-8">ไม่พบบทความ</div>`;
            return;
        }


        filteredArticles.forEach((article) => {
            const articleEl = document.createElement("div");
            articleEl.className = `bg-gray-700 rounded-lg shadow-md overflow-hidden transition-all duration-300 border-2 ${article.isPinned ? "border-yellow-500" : "border-transparent"
                }`;
            articleEl.dataset.id = article.id;
            let processedContent = article.content
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            if (lowerCaseQuery) {
                const regex = new RegExp(
                    query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                    "gi"
                );
                processedContent = processedContent.replace(
                    regex,
                    (match) => `<span class="highlight">${match}</span>`
                );
            }
            processedContent = processedContent.replace(
                /fronthub:("([^"]+)"|([^\s<]+))/g,
                (match, fullMatch, quotedPath, unquotedPath) => {
                    const path = quotedPath || unquotedPath;
                    return `<a href="fronthub:${path}" target="_blank" rel="noopener noreferrer" class="fronthub-link text-blue-400 hover:text-blue-300 hover:underline">${path}</a>`;
                }
            );
            const lineLimit = 5;
            const lines = processedContent.split("\n");
            let displayContent = processedContent.replace(/\n/g, "<br>");
            let readMoreLink = "";
            if (lines.length > lineLimit && !article.isExpanded) {
                displayContent = lines.slice(0, lineLimit).join("<br>") + "...";
                readMoreLink = `<a href="#" class="read-more text-red-400 hover:underline mt-2 inline-block">อ่านต่อ...</a>`;
            } else if (article.isExpanded) {
                readMoreLink = `<a href="#" class="collapse-link text-red-400 hover:underline mt-2 inline-block">ย่อลง...</a>`;
            }
            articleEl.innerHTML = `
                <div class="p-4">
                    <div class="flex justify-between items-start">
                        <div> <h3 class="text-lg font-bold text-white mb-1 cursor-pointer hover:text-blue-300 transition-colors">${article.title}</h3>
                <p class="article-timestamp text-xs text-gray-400">${formatDateTime(article.lastModified)}</p>
            </div>
                        <div class="flex items-center gap-2 text-gray-400">
                            <button class="pin-btn p-1 hover:text-yellow-400" title="ปักหมุด"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${article.isPinned ? "currentColor" : "none"
                }" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.75A1.75 1.75 0 0 1 7.25 9v0A1.75 1.75 0 0 1 9 7.25h6A1.75 1.75 0 0 1 16.75 9v0A1.75 1.75 0 0 1 15 10.75L12 14Z"/><path d="M9 9V4.5A2.5 2.5 0 0 1 11.5 2h1A2.5 2.5 0 0 1 15 4.5V9"/></svg></button>
                            <button class="edit-btn p-1 hover:text-blue-400" title="แก้ไข"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/><path d="M8 18h1"/><path d="M18.4 9.6a2 2 0 1 1 3 3L17 17l-4 1 1-4Z"/></svg></button>
                            <button class="delete-btn p-1 hover:text-red-400" title="ลบ"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                        </div>
                    </div><div class="text-gray-300 article-content text-sm leading-relaxed">${displayContent}</div>${readMoreLink}</div>`;
            articlesContainer.appendChild(articleEl);
        });
    }

    function renderQuickLinks() {
        quickLinksContainer.innerHTML = "";

        // วาดลิงก์ที่มีอยู่
        quickLinks.forEach((link) => {
            const linkWrapper = document.createElement("div");
            // 'group' และ 'relative' คือคีย์สำคัญสำหรับ Tailwind CSS
            linkWrapper.className = "relative group";

            const linkEl = document.createElement("a");
            linkEl.href = link.href;
            linkEl.textContent = link.text;
            if (link.href.startsWith("http")) {
                linkEl.target = "_blank";
                linkEl.rel = "noopener noreferrer";
            }
            linkEl.className =
                "bg-gray-600 hover:bg-gray-500 text-gray-200 font-bold py-2 px-4 rounded-lg transition duration-200 text-sm";
            linkWrapper.appendChild(linkEl);

            // สร้างส่วนควบคุม (ไอคอน) ที่จะซ่อนไว้
            const controls = document.createElement("div");
            controls.className = "absolute top-0 right-0 hidden group-hover:flex"; // ซ่อนปกติ, แสดงเมื่อ hover group
            controls.innerHTML = `
            <button data-id="${link.id}" class="edit-link-btn link-control-btn" title="แก้ไขลิงก์">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg>
            </button>
        `;
            linkWrapper.appendChild(controls);

            quickLinksContainer.appendChild(linkWrapper);
        });

        // เพิ่มปุ่ม "เพิ่มลิงก์" เข้าไปเป็นปุ่มสุดท้ายเสมอ
        const addLinkButton = document.createElement("button");
        addLinkButton.id = "add-quick-link-btn";
        addLinkButton.className =
            "bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm flex items-center gap-1";
        addLinkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg> เพิ่มลิงก์`;
        quickLinksContainer.appendChild(addLinkButton);
    }

    // --- MODAL & FORM HANDLING ---
    function showModal(id = null) {
        articleForm.reset();
        if (id) {
            const article = articles.find((a) => a.id === id);
            if (article) {
                modalTitle.textContent = "แก้ไขบทความ";
                articleIdInput.value = article.id;
                articleTitleInput.value = article.title;
                articleContentInput.value = article.content;
            }
        } else {
            modalTitle.textContent = "สร้างบทความใหม่";
            articleIdInput.value = "";
        }
        modal.classList.remove("hidden");
    }
    function hideModal() {
        modal.classList.add("hidden");
    }
    function showConfirm(message, callback) {
        confirmMessage.textContent = message;
        confirmModal.classList.remove("hidden");
        confirmCallback = callback;
    }
    function hideConfirm() {
        confirmModal.classList.add("hidden");
        confirmCallback = null;
    }

    // (New) Functions to show/hide the read-only modal
    function showReadModal(id) {
        const article = articles.find((a) => a.id === id);
        if (article) {
            readModalTitle.textContent = article.title;

            // ประมวลผล content เพื่อให้ลิงก์ fronthub ทำงานได้ใน popup
            let processedContent = article.content
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            processedContent = processedContent.replace(
                /fronthub:("([^"]+)"|([^\s<]+))/g,
                (match, fullMatch, quotedPath, unquotedPath) => {
                    const path = quotedPath || unquotedPath;
                    return `<a href="fronthub:${path}" target="_blank" rel="noopener noreferrer" class="fronthub-link text-blue-400 hover:text-blue-300 hover:underline">${path}</a>`;
                }
            );

            readModalContent.innerHTML = processedContent; // ใช้ innerHTML เพราะเราแปลงลิงก์เป็นแท็ก <a>
            readArticleModal.classList.remove("hidden");
        }
    }

    function hideReadModal() {
        readArticleModal.classList.add("hidden");
    }

    // (ใหม่) Modal handlers for Quick Links
    // (อัปเดต) Modal handlers for Quick Links
    const linkDeleteBtn = document.createElement("button"); // สร้างปุ่มลบ
    linkDeleteBtn.textContent = "ลบ";
    linkDeleteBtn.className =
        "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg";
    linkDeleteBtn.style.display = "none"; // ซ่อนไว้ก่อน

    function showLinkModal(id = null) {
        linkForm.reset();
        // ลบปุ่มลบเดิมออกก่อนเสมอ
        if (linkDeleteBtn.parentNode) {
            linkDeleteBtn.parentNode.removeChild(linkDeleteBtn);
        }

        if (id) {
            const link = quickLinks.find((l) => l.id === id);
            if (link) {
                linkModalTitle.textContent = "แก้ไขลิงก์ด่วน";
                linkIdInput.value = link.id;
                linkTextInput.value = link.text;
                linkHrefInput.value = link.href;

                // ถ้าเป็นการแก้ไข ให้แสดงปุ่มลบใน Modal
                linkDeleteBtn.dataset.id = id; // เก็บ id ไว้
                linkDeleteBtn.style.display = ""; // แสดงปุ่ม
                // เพิ่มปุ่มลบเข้าไปในส่วนท้ายของ Modal (ก่อนปุ่มบันทึก)
                linkModal
                    .querySelector(".p-4.border-t.border-gray-600.flex")
                    .insertBefore(linkDeleteBtn, linkSaveBtn);
            }
        } else {
            linkModalTitle.textContent = "เพิ่มลิงก์ด่วน";
            linkIdInput.value = "";
            linkDeleteBtn.style.display = "none"; // ซ่อนปุ่มลบถ้าเป็นการเพิ่มใหม่
        }
        linkModal.classList.remove("hidden");
    }
    function hideLinkModal() {
        linkModal.classList.add("hidden");
    }

    // --- EVENT LISTENERS ---
    addNewBtn.addEventListener("click", () => showModal());
    cancelBtn.addEventListener("click", hideModal);
    searchBox.addEventListener("input", () => renderArticles(searchBox.value));

    articleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(articleIdInput.value);
        const title = articleTitleInput.value.trim();
        const content = articleContentInput.value.trim();
        const now = new Date().toISOString(); // สร้างเวลาปัจจุบันในรูปแบบมาตรฐาน

        if (!title || !content) return;

        if (id) { // กรณีแก้ไขบทความเก่า
            const index = articles.findIndex(a => a.id === id);
            if (index > -1) {
                articles[index].title = title;
                articles[index].content = content;
                articles[index].lastModified = now; // **อัปเดตเวลาแก้ไข**
            }
        } else { // กรณีสร้างบทความใหม่
            articles.push({
                id: Date.now(),
                title,
                content,
                isPinned: false,
                isExpanded: false,
                createdAt: now, // **เพิ่มเวลาสร้าง**
                lastModified: now // **เพิ่มเวลาแก้ไข (ซึ่งเป็นเวลาเดียวกับเวลาสร้าง)**
            });
        }
        saveData();
        renderArticles(searchBox.value);
        hideModal();
    });

    articlesContainer.addEventListener("click", (e) => {
        const articleEl = e.target.closest("[data-id]");
        if (!articleEl) return;
        const id = parseInt(articleEl.dataset.id),
            article = articles.find((a) => a.id === id);

        // ตรวจสอบว่าสิ่งที่ถูกคลิกคือ <h3> ที่เป็นหัวข้อหรือไม่
        if (e.target.closest("h3")) {
            showReadModal(id); // ถ้าใช่ ให้เรียก modal อ่านบทความ
            return; // จบการทำงานทันที เพื่อไม่ให้ไปโดนปุ่มอื่น
        }

        if (e.target.closest(".edit-btn")) showModal(id);

        if (e.target.closest('.pin-btn')) {
            if (article) {
                article.isPinned = !article.isPinned;
                article.lastModified = new Date().toISOString(); // **อัปเดตเวลาเมื่อปักหมุด**
                saveData();
                renderArticles(searchBox.value);
            }
        }

        if (e.target.closest(".read-more")) {
            e.preventDefault();
            if (article) {
                article.isExpanded = true;
                saveData();
                renderArticles(searchBox.value);
            }
        }

        if (e.target.closest(".collapse-link")) {
            e.preventDefault();
            if (article) {
                article.isExpanded = false;
                saveData();
                renderArticles(searchBox.value);
            }
        }

        if (e.target.closest(".delete-btn")) {
            showConfirm("คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?", (confirmed) => {
                if (confirmed) {
                    articles = articles.filter((a) => a.id !== id);
                    saveData();
                    renderArticles(searchBox.value);
                }
                hideConfirm();
            });
        }
    });

    confirmOkBtn.addEventListener("click", () => {
        if (confirmCallback) confirmCallback(true);
    });
    confirmCancelBtn.addEventListener("click", () => {
        if (confirmCallback) confirmCallback(false);
        hideConfirm();
    });

    backupBtn.addEventListener("click", () => {
        const dataStr = JSON.stringify({ articles, quickLinks }, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement("a");
        a.href = url;
        const now = new Date();
        a.download = `kb-backup-${now.toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("สำรองข้อมูลเสร็จสิ้น!");
    });

    // (New) Event listeners for closing the read modal
    readModalCloseBtn.addEventListener("click", hideReadModal);
    readArticleModal.addEventListener("click", (e) => {
        // ปิด Modal เมื่อคลิกที่พื้นหลังสีดำด้านนอก
        if (e.target.id === "read-article-modal") {
            hideReadModal();
        }
    });

    restoreInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const restoredData = JSON.parse(event.target.result);
                if (
                    restoredData &&
                    Array.isArray(restoredData.articles) &&
                    Array.isArray(restoredData.quickLinks)
                ) {
                    showConfirm(
                        "การกู้ข้อมูลจะเขียนทับข้อมูลปัจจุบันทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?",
                        (confirmed) => {
                            if (confirmed) {
                                articles = restoredData.articles;
                                quickLinks = restoredData.quickLinks;
                                saveData();
                                renderArticles();
                                renderQuickLinks();
                                showToast("กู้ข้อมูลสำเร็จ!");
                            }
                            hideConfirm();
                            restoreInput.value = "";
                        }
                    );
                } else {
                    throw new Error("Invalid file format");
                }
            } catch (err) {
                alert("เกิดข้อผิดพลาด: ไฟล์ข้อมูลไม่ถูกต้อง");
                restoreInput.value = "";
            }
        };
        reader.readAsText(file);
    });

    // --- (ใหม่) QUICK LINKS EVENT LISTENERS ---
    // (ใหม่) Event Listener สำหรับปุ่ม "เพิ่มลิงก์" ที่อยู่ใน Quick Links Container
    quickLinksContainer.addEventListener("click", (e) => {
        // หาปุ่มที่ถูกคลิก
        const addBtn = e.target.closest("#add-quick-link-btn");
        const editBtn = e.target.closest(".edit-link-btn");
        const deleteBtn = e.target.closest(".delete-link-btn");

        if (addBtn) {
            showLinkModal(); // เปิด modal สำหรับสร้างลิงก์ใหม่
        }

        if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            showLinkModal(id); // เปิด modal สำหรับแก้ไข
        }

        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            showConfirm("คุณแน่ใจว่าต้องการลบลิงก์นี้?", (confirmed) => {
                if (confirmed) {
                    quickLinks = quickLinks.filter((l) => l.id !== id);
                    saveData();
                    renderQuickLinks();
                }
                hideConfirm();
            });
        }
    });
    linkCancelBtn.addEventListener("click", hideLinkModal);

    // (ใหม่) Event Listener สำหรับปุ่มลบใน Modal ของลิงก์
    linkDeleteBtn.addEventListener("click", (e) => {
        const id = parseInt(linkDeleteBtn.dataset.id); // ดึง id จากปุ่ม
        showConfirm("คุณแน่ใจว่าต้องการลบลิงก์นี้?", (confirmed) => {
            if (confirmed) {
                quickLinks = quickLinks.filter((l) => l.id !== id);
                saveData();
                renderQuickLinks();
                hideLinkModal(); // ปิด Modal หลังจากลบ
            }
            hideConfirm();
        });
    });

    linkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = parseInt(linkIdInput.value);
        const text = linkTextInput.value.trim();
        const href = linkHrefInput.value.trim();

        if (!text || !href) return;

        if (id) {
            // Edit existing link
            const index = quickLinks.findIndex((l) => l.id === id);
            if (index > -1) {
                quickLinks[index] = { ...quickLinks[index], text, href };
            }
        } else {
            // Add new link
            quickLinks.push({ id: Date.now(), text, href });
        }
        saveData();
        renderQuickLinks();
        hideLinkModal();
    });

    quickLinksContainer.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-link-btn");
        const deleteBtn = e.target.closest(".delete-link-btn");

        if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            showLinkModal(id);
        }

        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            showConfirm("คุณแน่ใจว่าต้องการลบลิงก์นี้?", (confirmed) => {
                if (confirmed) {
                    quickLinks = quickLinks.filter((l) => l.id !== id);
                    saveData();
                    renderQuickLinks();
                }
                hideConfirm();
            });
        }
    });

    window.addEventListener("beforeunload", (event) => {
        const dataBlob = new Blob([JSON.stringify({ articles, quickLinks })], {
            type: "application/json",
        });
        navigator.sendBeacon("http://localhost:3000/save", dataBlob);
    });

    // --- INITIALIZATION ---
    async function initialize() {
        await loadData();
        renderArticles();
        renderQuickLinks(); // (ใหม่) เรียกใช้ render quick links ด้วย
    }

    initialize();
});

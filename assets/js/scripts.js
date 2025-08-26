(function ($) {
	"use strict";

	/*********************************
	 * Browser Detecor
	 *********************************/
	// 🔒 Block Right Click
	document.addEventListener("contextmenu", function (e) {
		e.preventDefault();
		alert("Right-click is disabled.");
	});

	// 🔒 Block, Ctrl+U, Ctrl+Shift+I
	document.addEventListener("keydown", function (e) {
		// F12
		if (e.keyCode === 123) {
			alert("Developer Tools are disabled.");
			s;
			e.preventDefault();
			return false;
		}
		//Ctrl + U;
		if (e.ctrlKey && e.key.toLowerCase() === "u") {
			// Wipe the content completely
			document.body.innerHTML = "<h1 style='color:red; text-align:center;'>❌ Source code access is blocked.</h1>";
			e.preventDefault();
			return false;
		}

		// Ctrl+Shift+I or Cmd+Opt+I (Mac)
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
			alert("Inspect is disabled.");
			e.preventDefault();
			return false;
		}
	});

	/*********************************
	 * Sticky Navbar
	 *********************************/
	$(window).on("scroll", function () {
		const scrolling = $(this).scrollTop();
		const header = $(".header");

		if (scrolling >= 10) {
			header.addClass("nav-bg");
		} else {
			header.removeClass("nav-bg");
		}
	});

	/*********************************
	 * Toggle Mobile Menu
	 *********************************/
	$(".header__toggle").on("click", function (e) {
		e.preventDefault();
		$(this).toggleClass("active");
		$(".header__menu").toggleClass("mblMenu__open");
	});

	$(".header .header__menu ul li a").on("click", function () {
		$(".header__toggle").removeClass("active");
		$(".header__menu").removeClass("mblMenu__open");
	});

	/*********************************
	 * Smooth Scroll
	 *********************************/
	$(".header .header__menu ul li a").on("click", function (e) {
		const target = this.hash;
		const $target = $(target);

		if ($target.length) {
			e.preventDefault();
			$("html, body")
				.stop()
				.animate(
					{
						scrollTop: $target.offset().top - 150,
					},
					100,
					"swing",
					function () {
						window.location.hash = target;
					}
				);
		}
	});

	/*********************************
	 * Language Dropdown
	 *********************************/
	$(".language__dropdown .selected").on("click", function (e) {
		e.preventDefault();
		$(".dropdown__list").toggleClass("active");
	});

	$(document).on("click", function (e) {
		if (!$(e.target).closest(".meta__list").length && !$(e.target).closest(".language__dropdown").length) {
			$(".dropdown__list").removeClass("active");
		}
	});

	/*********************************
	 * AOS Animation
	 *********************************/
	AOS.init();

	/*********************************
	 * Image Converter Logic
	 *********************************/
	// ========== Global Variables ==========
	let selectedFormat = "";
	let selectedExtension = "";
	let files = [];

	// ========== DOM Elements ==========
	const uploadArea = document.getElementById("uploadArea");
	const fileInput = document.getElementById("fileInput");
	const widthInput = document.getElementById("widthInput");
	const heightInput = document.getElementById("heightInput");
	const resizeLabel = document.querySelector(".resize .info__title span");

	// ========== Drag & Drop Upload ==========
	uploadArea.addEventListener("click", () => fileInput.click());

	uploadArea.addEventListener("dragover", (e) => {
		e.preventDefault();
		uploadArea.classList.add("dragover");
	});

	uploadArea.addEventListener("dragleave", () => {
		uploadArea.classList.remove("dragover");
	});

	uploadArea.addEventListener("drop", (e) => {
		e.preventDefault();
		uploadArea.classList.remove("dragover");

		const droppedFiles = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/") || f.type === "application/pdf" || f.type === "image/svg+xml");
		files.push(...droppedFiles);
		updateFileList();
		showPreview();
	});

	// ========== File Input Upload ==========
	fileInput.addEventListener("change", (e) => {
		const selectedFiles = [...e.target.files].filter((f) => f.type.startsWith("image/") || f.type === "application/pdf" || f.type === "image/svg+xml");
		files.push(...selectedFiles);
		updateFileList();
		showPreview();
	});

	// ========== Format Button Selection ==========
	document.querySelectorAll(".select__btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			// Remove active class from all buttons
			document.querySelectorAll(".select__btn").forEach((b) => b.classList.remove("active"));
			// Add to clicked one
			btn.classList.add("active");

			// Set selected format and extension
			selectedFormat = btn.dataset.format;
			selectedExtension = btn.dataset.extension || selectedFormat;
		});
	});

	// ========== Quality Slider ==========
	document.getElementById("qualitySlider").addEventListener("input", function () {
		document.getElementById("qualityValue").textContent = `${this.value}%`;
	});

	// ========== Resize Label Update ==========
	function updateResizeLabel() {
		const w = widthInput.value || 0;
		const h = heightInput.value || 0;
		resizeLabel.textContent = `${w}px * ${h}`;
	}

	widthInput.addEventListener("input", updateResizeLabel);
	heightInput.addEventListener("input", updateResizeLabel);

	// ========== File List Display ==========
	function updateFileList() {
		const fileList = document.getElementById("fileList");
		fileList.innerHTML = "";

		files.forEach((file, index) => {
			const li = document.createElement("li");

			const displaySize =
				file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(2)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

			li.innerHTML = `<i class="fi fi-rr-picture"></i> ${file.name} - <span>${displaySize}</span>`;

			const deleteBtn = document.createElement("button");
			deleteBtn.textContent = "✕";
			deleteBtn.addEventListener("click", () => {
				files.splice(index, 1);
				updateFileList();
				showPreview();
			});

			li.appendChild(deleteBtn);
			fileList.appendChild(li);
		});
	}

	// ========== Image Preview ==========
	function showPreview() {
		const preview = document.getElementById("preview");
		preview.innerHTML = "";

		files.forEach((file) => {
			const wrapper = document.createElement("div");
			wrapper.className = "image__card";

			const img = document.createElement("img");
			img.src = URL.createObjectURL(file);

			const fileInfo = document.createElement("p");

			wrapper.appendChild(img);
			wrapper.appendChild(fileInfo);
			preview.appendChild(wrapper);
		});
	}

	// ========== Format File Size ==========
	function formatFileSize(sizeInBytes) {
		const sizeInKB = sizeInBytes / 1024;
		return sizeInKB < 1024 ? `${sizeInKB.toFixed(2)} KB` : `${(sizeInKB / 1024).toFixed(2)} MB`;
	}

	// ========== Convert Images ==========
	document.getElementById("convertBtn").addEventListener("click", async () => {
		if (!selectedFormat) {
			alert("Please select a conversion format.");
			return;
		}

		document.getElementById("fullPageLoader").style.display = "flex";

		const quality = parseInt(document.getElementById("qualitySlider").value) / 100;
		const width = parseInt(widthInput.value);
		const height = parseInt(heightInput.value);
		const shouldResize = !isNaN(width) && !isNaN(height);

		const preview = document.getElementById("preview");
		preview.innerHTML = "";

		const convertedFiles = [];

		try {
			// Use modular ImageConverter for all formats
			const results = await window.ImageConverter.convertFiles(files, selectedExtension);
			window.ImageConverter.renderPreviews(results, document.getElementById("preview"));
			// Update files array to blobs for download
			files = results.map(r => r.blob);
			updateFileList();
		} catch (error) {
			alert("Error during conversion. Please try again.");
			console.error(error);
		} finally {
			document.getElementById("fullPageLoader").style.display = "none";
		}
	});

	// ========== Download All as ZIP ==========
	document.getElementById("downloadZip").addEventListener("click", async () => {
		if (files.length === 0) {
			alert("No images to download.");
			return;
		}

		const zip = new JSZip();

		for (const [i, file] of files.entries()) {
			const blob = await file.arrayBuffer();
			zip.file(`image${i + 1}.${selectedExtension}`, blob);
		}

		zip.generateAsync({ type: "blob" }).then((content) => {
			saveAs(content, "compressed_images.zip");
		});
	});

	// ========== Clear All ==========
	document.getElementById("clearAll").addEventListener("click", () => {
		files = [];
		document.getElementById("preview").innerHTML = "";
		document.getElementById("fileInput").value = "";
		document.getElementById("fileList").innerHTML = "";
		widthInput.value = "";
		heightInput.value = "";
		updateResizeLabel();
	});
})(jQuery);

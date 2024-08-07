
document.addEventListener('DOMContentLoaded', function () {
    initializeDragAndDrop();
    initializeAdvancedOptions();
    initializeCustomPageSize();
    initializeForm();
});

function initializeDragAndDrop()
{
    const imageInput = document.getElementById('image');
    const imageInfo = document.getElementById('image-info');
    const dropArea = document.getElementById('drop-area');
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d');

    // Prevent default behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    // Handle drop
    dropArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        const file = files[0];
        if (file && file.type.startsWith('image/')) {
            imageInput.files = files; // Assign files to the hidden file input
            previewFile(file);
        }
    }

    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                // Draw the circular image (clipped to a circle)
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Add a 2px border around the circle
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.height / 2) - 0.5, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'red';
                ctx.stroke();

                // Add a 2px border around the circle
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, ((0.875/1.1313*500) / 2) - 0.5, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'green';
                ctx.stroke();

            }
        }
    }

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                if (img.width !== img.height) {
                    feedback.textContent = 'The image must be square.';
                    feedback.classList.remove('success');
                    feedback.classList.add('error');
                    feedback.style.display = 'block';
                    imageInput.value = ''; // Clear the input
                } else {
                    imageInfo.textContent = `Image Size: ${img.width} x ${img.height} pixels`;
                    feedback.style.display = 'none';
                }
        };
        img.src = URL.createObjectURL(file);
        }
    });
}

function initializeCustomPageSize()
{
    const pageSizeSelect = document.getElementById('pageSize');
    const customPageSizeDiv = document.getElementById('customPageSize');

    // Custom page size handler
    pageSizeSelect.addEventListener('change', () => {
        if (pageSizeSelect.value === 'CUSTOM') {
            customPageSizeDiv.style.display = 'block';
            document.getElementById('pageWidth').required = true;
            document.getElementById('pageHeight').required = true;
        } else {
            customPageSizeDiv.style.display = 'none';
            document.getElementById('pageWidth').required = false;
            document.getElementById('pageHeight').required = false;
        }
    });
}

function initializeAdvancedOptions()
{
    const advancedOptionsToggle = document.getElementById('advanced-options-toggle');
    const advancedOptions = document.getElementById('advanced-options');
    let advancedOptionsVisible = false;

    // Advanced options toggle
    advancedOptionsToggle.addEventListener('click', (e) => {
        e.preventDefault();
        advancedOptionsVisible = !advancedOptionsVisible;
        advancedOptions.style.display = advancedOptionsVisible ? 'block' : 'none';
        advancedOptionsToggle.textContent = advancedOptionsVisible ? 'Hide advanced options 🔼' : 'Show advanced options 🔽';
    });
}

function initializeForm()
{
    const form = document.getElementById('pdf-form');
    const feedback = document.querySelector('.feedback');
    const pageSizeSelect = document.getElementById('pageSize');

    // Form submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const pageSize = pageSizeSelect.options[pageSizeSelect.selectedIndex];
        const pageWidth = pageSize.dataset.width || formData.get('pageWidth');
        const pageHeight = pageSize.dataset.height || formData.get('pageHeight');

        formData.append('pageWidth', pageWidth);
        formData.append('pageHeight', pageHeight);

        try {
            const response = await fetch('/generate-pdf', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                feedback.textContent = 'PDF generated successfully!';
                feedback.classList.remove('error');
                feedback.classList.add('success');
                feedback.style.display = 'block';

                // Download the PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = formData.get('outputFileName');
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Failed to generate PDF');
            }
        } catch (error) {
            feedback.textContent = error.message;
            feedback.classList.remove('success');
            feedback.classList.add('error');
            feedback.style.display = 'block';
        }
    });
}
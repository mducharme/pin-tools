document.addEventListener('DOMContentLoaded', function () {
    
    const imageInput = document.getElementById('image');
    const pageSizeWidthInput = document.getElementById('page-width');
    const pageSizeHeightInput = document.getElementById('page-height');
    const paddingInput = document.getElementById('padding');
    const resolutionInput = document.getElementById('resolution');
    const imageSizeInput = document.getElementById('image-size');
    const pinSizeInput = document.getElementById('pin-size');

    const showGuidesCheckbox = document.getElementById('show-guides');

    const imageScaleInput = document.getElementById('image-scale');
    const imageBackgroundColorInput = document.getElementById('image-background-color');
    const imagePanXInput = document.getElementById('image-pan-x');
    const imagePanYInput = document.getElementById('image-pan-y');

    let config = {image:null};
    updateConfig(config);

    
    initializeOffsetWithMouse();
    initializeDragAndDrop();
    initializeAdvancedOptions();
    initializeCustomPageSize();
    initializeMultipleImages();
    initializeForm();

    [imageScaleInput, pageSizeWidthInput, pageSizeHeightInput, paddingInput, 
        resolutionInput, imageSizeInput, pinSizeInput, showGuidesCheckbox, 
        imageBackgroundColorInput, imagePanXInput, imagePanYInput
    ].forEach(element => {
        element.addEventListener('input', () => {
            updateConfig();
            drawCanvas();
        });
    });

    function updateConfig()
    {
        const oldImg = config.image;
        const oldImgOpts = config.imageOptions;
        config = {
            image: oldImg,
            imageOptions: oldImgOpts,
            pageSize: {
                width: parseFloat(pageSizeWidthInput.value), 
                height: parseFloat(pageSizeHeightInput.value)
            },
            padding: parseFloat(paddingInput.value),
            resolution: parseInt(resolutionInput.value),
            imageSize: parseFloat(imageSizeInput.value),
            pinSize: parseFloat(pinSizeInput.value),
            status: {
                showGuides: showGuidesCheckbox.checked,
                showAdvancedOptions: true,
                showCustomPageSizes: false
            },
            controls: {
                scale: parseFloat(imageScaleInput.value),
                backgroundColor: imageBackgroundColorInput.value,
                pan: {
                    x: parseFloat(imagePanXInput.value),
                    y: parseFloat(imagePanYInput.value)
                }
            }
        };
    }

    function drawCanvas(img)
    {
        if (!img) {
            img = config.image;
        }
        
        const canvas = document.getElementById('image-canvas');
        const ctx = canvas.getContext('2d');
        
        const pinSize = parseFloat(pinSizeInput.value);
        const imageSize = parseFloat(imageSizeInput.value);
        //const imageSizePixels = imageSize * config.controls.resolution;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

         // Draw the background color
         ctx.fillStyle = config.controls.backgroundColor;
         ctx.fillRect(0, 0, canvas.width, canvas.height)

         // Draw the circular image (clipped to a circle)
         if (img) {
            const imgWidth = img.width * config.controls.scale;
            const imgHeight = img.height * config.controls.scale;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
            ctx.clip();
            //ctx.drawImage(img, 0,0, canvas.width, canvas.height);
            ctx.drawImage(img, canvas.width/2-imgWidth/2+config.controls.pan.x, canvas.height/2-imgHeight/2+config.controls.pan.y, imgWidth, imgHeight);
         }

        if (config.status.showGuides) {

            // Add a 2px border around the circle
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.height / 2) - 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            ctx.stroke();

            // Add a 2px border around the circle
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, ((pinSize/imageSize*canvas.height) / 2) - 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            ctx.stroke();
        }
    }

    function initializeOffsetWithMouse() {
        const canvas = document.getElementById('image-canvas');
        let isDown = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;
        canvas.addEventListener('mousedown', (event) => handleMouseDown(event));
        canvas.addEventListener('mousemove', (event) => handleMouseMove(event));
        canvas.addEventListener('mouseup', (event) => handleMouseUp(event));
        canvas.addEventListener('mouseout', (event) => handleMouseOut(event));

        function handleMouseDown(e){
            e.preventDefault();
            e.stopPropagation();
        
            startX=parseInt(e.clientX-offsetX);
            startY=parseInt(e.clientY-offsetY);
            isDown=true;
        }
        
        function handleMouseUp(e){
            e.preventDefault();
            e.stopPropagation();
            isDown=false;
        }
        
        function handleMouseOut(e){
            e.preventDefault();
            e.stopPropagation();
            isDown=false;
        }
        
        function handleMouseMove(e){
        
            if(!isDown){return;}
            if(!config.image){return;}

            e.preventDefault();
            e.stopPropagation();
        
            const mouseX=parseInt(e.clientX-offsetX);
            const mouseY=parseInt(e.clientY-offsetY);
        
            var dx=mouseX-startX;
            var dy=mouseY-startY;
        
            startX=mouseX;
            startY=mouseY;

            imagePanXInput.value = parseFloat(imagePanXInput.value) + dx;
            imagePanYInput.value = parseFloat(imagePanYInput.value) + dy;
            updateConfig();
            drawCanvas();
        
        }
    }

        


    function initializeDragAndDrop()
    {
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
                    config.image = img;
                    drawCanvas();
                }
            }
        }

        imageInput.addEventListener('change', () => {
            const file = imageInput.files[0];
            if (file) {
                const img = new Image();
                img.onload = () => {
                    imageInfo.textContent = `Image Size: ${img.width} x ${img.height} pixels`;
                    feedback.style.display = 'none';
                };
                img.src = URL.createObjectURL(file);
            }
        });
    }

    function initializeCustomPageSize()
    {
        const pageSizeSelect = document.getElementById('page-size');
        const customPageSizeDiv = document.getElementById('custom-page-size');

        // Custom page size handler
        pageSizeSelect.addEventListener('change', () => {
            if (pageSizeSelect.value === 'CUSTOM') {
                customPageSizeDiv.style.display = 'block';
                document.getElementById('page-width').required = true;
                document.getElementById('page-height').required = true;
            } else {
                customPageSizeDiv.style.display = 'none';
                document.getElementById('page-width').required = false;
                document.getElementById('page-height').required = false;
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

    function initializeMultipleImages()
    {
        const addImageButton = document.getElementById('add-image-button');
        const imageContainer = document.getElementById('image-container');
    
        addImageButton.addEventListener('click', () => {
          const newIndex = document.querySelectorAll('.image-group').length;
          const newImageGroup = document.querySelector('.image-group').cloneNode(true);
          
          // Update the input names with the new index
          const inputs = newImageGroup.querySelectorAll('input, select');
          inputs.forEach(input => {
            const name = input.getAttribute('name');
            if (name) {
              input.setAttribute('name', name.replace(/\[\d+\]/, `[${newIndex}]`));
            }
            
            // Reset values
            if (input.type !== "file") {
              input.value = input.defaultValue;
            }
            if (input.type === "file") {
              input.removeAttribute("required");
            }
          });
    
          // Clear the canvas
          const canvas = newImageGroup.querySelector('.image-canvas');
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
    
          imageContainer.appendChild(newImageGroup);
        });
    }

    function initializeForm()
    {
        const form = document.getElementById('pdf-form');
        const feedback = document.querySelector('.feedback');
        const pageSizeSelect = document.getElementById('page-size');

        // Form submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const pageSize = pageSizeSelect.options[pageSizeSelect.selectedIndex];
            const pageWidth = pageSize.dataset.width || formData.get('pageWidth');
            const pageHeight = pageSize.dataset.height || formData.get('pageHeight');

            formData.append('pageWidth', pageWidth);
            formData.append('pageHeight', pageHeight);

            console.log(formData.entries());

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

});
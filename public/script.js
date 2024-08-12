document.addEventListener('DOMContentLoaded', function () {
    
    const pageSizeWidthInput = document.getElementById('page-width');
    const pageSizeHeightInput = document.getElementById('page-height');
    const paddingInput = document.getElementById('padding');
    const resolutionInput = document.getElementById('resolution');
    const imageSizeInput = document.getElementById('image-size');
    const pinSizeInput = document.getElementById('pin-size');

    let config = {
        images:[], 
        imageOptions:[]
    };
    updateConfig(config);

    initializeMultipleImages();
    initializeForm();
    
    const imageGroups = document.querySelectorAll('.image-group');
    imageGroups.forEach((imageGroup) => {
        initializeImageOptions(imageGroup);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        document.body.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    function updateConfig()
    {
        const oldImg = config.images;
        config = {
            images: oldImg,
            pageSize: {
                width: parseFloat(pageSizeWidthInput.value), 
                height: parseFloat(pageSizeHeightInput.value),
                
            },
            padding: parseFloat(paddingInput.value),
            resolution: parseInt(resolutionInput.value),
            imageSize: parseFloat(imageSizeInput.value),
            pinSize: parseFloat(pinSizeInput.value),
            status: {
                showAdvancedOptions: true,
                showCustomPageSizes: false
            }
        };
    }


    function drawCanvas(imageGroup)
    {
        const index = parseInt(imageGroup.querySelector('.image-index').value);
        const img = config.images[index];

        const canvas = imageGroup.querySelector('.image-canvas');
        const ctx = canvas.getContext('2d');

        const scale = parseFloat(imageGroup.querySelector('.image-scale').value);
        const backgroundColor = imageGroup.querySelector('.image-background-color').value;
        const offsetX = parseFloat(imageGroup.querySelector('.image-offset-x').value);
        const offsetY = parseFloat(imageGroup.querySelector('.image-offset-y').value);
        const showGuides = imageGroup.querySelector('.show-guides').checked;


        const pinSize = parseFloat(pinSizeInput.value);
        const imageSize = parseFloat(imageSizeInput.value);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

         // Draw the background color
         ctx.fillStyle = backgroundColor;
         ctx.fillRect(0, 0, canvas.width, canvas.height)

         // Draw the circular image (clipped to a circle)
         if (img) {
            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
            ctx.clip();
            //ctx.drawImage(img, 0,0, canvas.width, canvas.height);
            ctx.drawImage(img, canvas.width/2-imgWidth/2+offsetX, canvas.height/2-imgHeight/2+offsetY, imgWidth, imgHeight);
         }

        if (showGuides) {
            // Add outer guide circle
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.height / 2) - 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            ctx.stroke();

            // Add pin guide circle
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, ((pinSize/imageSize*canvas.height) / 2) - 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            ctx.stroke();
        }
    }

    function initializeMultipleImages()
    {
        const addImageButton = document.getElementById('add-image-button');
        const imageContainer = document.getElementById('image-container');
    
        addImageButton.addEventListener('click', () => {
            
          const newIndex = document.querySelectorAll('.image-group').length;
          const newImageGroup = document.querySelector('.image-group').cloneNode(true);
          const newIndexInput = newImageGroup.querySelector('.image-index');

          // Update the input names with the new index
          newIndexInput.value = newIndex;
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
          
          initializeImageOptions(newImageGroup);
        });
    }

    function initializeOffsetWithMouse(imageGroup) {
        const canvas = imageGroup.querySelector('.image-canvas');

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
            if(config.images[0] === undefined){return;}

            e.preventDefault();
            e.stopPropagation();
        
            const mouseX=parseInt(e.clientX-offsetX);
            const mouseY=parseInt(e.clientY-offsetY);
        
            var dx=mouseX-startX;
            var dy=mouseY-startY;
        
            startX=mouseX;
            startY=mouseY;

            const offsetXInput = imageGroup.querySelector('.image-offset-x');
            const offsetYInput = imageGroup.querySelector('.image-offset-y');
            prevOffsetX = parseFloat(offsetXInput.value);
            prevOffsetY = parseFloat(offsetYInput.value);
            offsetXInput.value = prevOffsetX + dx;
            offsetYInput.value = prevOffsetY + dy;

            updateConfig();
            drawCanvas(imageGroup);
        
        }
    }

    function initializeDragAndDrop(imageGroup)
    {
        const dropArea = imageGroup.querySelector('.drop-area');
        const imageInput = imageGroup.querySelector('.image-input');
        const index = imageGroup.querySelector('.image-index').value;

        // Prevent default behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            dropArea.addEventListener(event, preventDefaults, false);
            document.body.addEventListener(event, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(event => {
            dropArea.addEventListener(event, () => dropArea.classList.add('highlight'), false);
        });
        ['dragleave', 'drop'].forEach(event => {
            dropArea.addEventListener(event, () => dropArea.classList.remove('highlight'), false);
        });

        /*dropArea.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', () => {
            const file = imageInput.files[0];
            handleImage(file);
        });*/

        // Handle drop (create an Image with the flies)
        dropArea.addEventListener('drop', (event) => {
            const files = event.dataTransfer.files;
            handleImage(files);
        });

        function handleImage(files) {
            const file =  files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    const img = new Image();
                    img.src = reader.result;
                
                    img.onload = () => {
                        config.images[index] = img;
                        drawCanvas(imageGroup);
                    }
                    imageInput.files = files;
                }
            }
        }

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function initializeImageOptions(imageGroup)
    {
        const imageScaleInput = imageGroup.querySelector('.image-scale');
        const imageBackgroundColorInput = imageGroup.querySelector('.image-background-color');
        const imageOffsetXInput = imageGroup.querySelector('.image-offset-x');
        const imageOffsetYInput = imageGroup.querySelector('.image-offset-y');
        const showGuidesCheckbox = imageGroup.querySelector('.show-guides');

        [imageScaleInput, imageBackgroundColorInput, imageOffsetXInput, imageOffsetYInput, showGuidesCheckbox].forEach((element) => {
            element.addEventListener('input', () => {
                updateConfig();
                drawCanvas(imageGroup);
            });
        });

        imageBackgroundColorInput.addEventListener('change', () => {
            updateConfig();
            drawCanvas(imageGroup);
        });

        initializeDragAndDrop(imageGroup);
        initializeOffsetWithMouse(imageGroup);
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

    function initializeForm()
    {
        const form = document.getElementById('pdf-form');
        const feedback = document.querySelector('.feedback');
        const pageSizeSelect = document.getElementById('page-size');

        initializeAdvancedOptions();
        initializeCustomPageSize();
        
        [pageSizeWidthInput, pageSizeHeightInput, paddingInput, resolutionInput, imageSizeInput, pinSizeInput].forEach((element) => {
            element.addEventListener('input', () => {
                updateConfig();
            });
        });

        // Form submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const pageSizeSelected = pageSizeSelect.options[pageSizeSelect.selectedIndex];
            const pageWidth = pageSizeSelected.dataset.width || formData.get('pageWidth');
            const pageHeight = pageSizeSelected.dataset.height || formData.get('pageHeight');

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

});
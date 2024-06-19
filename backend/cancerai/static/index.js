const dropArea = document.getElementById("drop-area")
const inputFile = document.getElementById("input-file")
const imgView = document.getElementById("img-view")
const uploadImg = document.getElementById("upload-img")

inputFile.addEventListener("change", function(){
    let imgUrl = URL.createObjectURL(inputFile.files[0]);
    if(imgUrl){
        uploadImg.innerHTML = `<img src=${imgUrl} alt="">`;
        imgView.classList.add("none")
    } else{
        imgView.classList.remove("none")
        imgView.innerHTML = "<img src='icon-removebg-preview.png'><p>Drag and drop or click here <br> to upload image</p><span>Uplaod any images from desktop</span>"
    }
})
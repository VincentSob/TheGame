
document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("btnShowOff").addEventListener("click", function() {
        const footer = document.querySelector('footer');
        if (footer.style.display == 'none'){
            footer.style.display='';
        }else{
            footer.style.display = 'none';
        }
    });
});
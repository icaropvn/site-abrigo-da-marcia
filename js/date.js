document.addEventListener('DOMContentLoaded', function() {
    let copyrightText = document.getElementById('copyright-text')
    let dateToday = new Date()
    let yearToday = dateToday.getFullYear()

    copyrightText.innerHTML = `&copy; ${yearToday} Abrigo da Márcia.`
})
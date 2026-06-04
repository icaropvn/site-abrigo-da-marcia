document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('dog-detail-modal');
    const modalClose = document.querySelector('.modal-close');

    function openModal(data) {
        document.getElementById('modal-dog-image').src = data.image;
        document.getElementById('modal-dog-image').alt = data.name;
        document.getElementById('modal-dog-name').textContent = data.name;
        document.getElementById('modal-dog-gender').textContent = data.gender;
        document.getElementById('modal-dog-age').textContent = data.age;
        document.getElementById('modal-dog-size').textContent = data.size;
        document.getElementById('modal-dog-description').textContent = data.description;
        document.getElementById('modal-dog-button').href = data.formUrl;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.catalog-card').forEach(function(card) {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.catalog-card-button')) return;

            const tags = card.querySelectorAll('.catalog-card-tags span');
            openModal({
                name: card.querySelector('.catalog-card-name').textContent.trim(),
                gender: tags[0] ? tags[0].textContent.trim() : '',
                age: tags[1] ? tags[1].textContent.trim() : '',
                size: tags[2] ? tags[2].textContent.trim() : '',
                description: card.querySelector('.catalog-card-description').textContent.trim(),
                image: card.getAttribute('data-img'),
                formUrl: card.querySelector('.catalog-card-button').href
            });
        });
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

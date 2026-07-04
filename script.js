// Функция для переключения между экранами
function nextScreen(screenNumber) {
    // Находим текущий активный экран и скрываем его
    const currentActive = document.querySelector('.screen.active');
    if (currentActive) {
        currentActive.classList.remove('active');
    }

    // Находим нужный экран и показываем его
    const nextScreen = document.getElementById(`screen-${screenNumber}`);
    if (nextScreen) {
        nextScreen.classList.add('active');
    }
}
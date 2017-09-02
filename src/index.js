// Работа с VK-API
    // Обработка метода запроса
function vkApi (method, options) {
    if (!options.v) {
        options.v = '5.64'
    }

    return new Promise((resolve, reject) => {
        VK.api(method, options, data => {
            if (data.error) {
                reject(new Error(data.error.error_msg))
            } else {
                resolve(data.response)
            }
        });
    });
}

    // Инициализация приложения, авторизация
function vkInit () {

    return new Promise((resolve, reject) => {
        VK.init({
            apiId: 6060252
        })

        VK.Auth.login(response => {
            if (response.session) {
                resolve(response)
            } else {
                reject(new Error('Не удалось авторизоваться'))
            }
        }, 2)
    })
}

// Работа с Yandex-API (Яндекс-карты)
    // Обработка результатов геокодирования
function geocode (adress) {

    return ymaps.geocode(adress, {
        results: 1
    })
        .then(result => {

            return result.geoObjects.get(0).geometry.getCoordinates()
        });
}

var myMap;
var clusterer;

// Промис работы приложения
new Promise(resolve => window.onload = resolve)
.then(() => vkInit())
.then(() => new Promise(resolve => ymaps.ready(resolve)))
.then(() => vkApi('friends.get', { fields: 'photo_200,country,city' }))
.then(friends => {
    myMap = new ymaps.Map('map', {
        center: [59.91817154482064, 30.30557799999997], // Санкт-Петербург
        zoom: 10,
        controls: []
    }, {
        searchControlProvider: 'yandex#search'
    }),
    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedRedClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
    });
    myMap.geoObjects.add(clusterer);

    return friends.items
})
.then(friends => {
    let placemarkContent = [],
        string,
        promises = friends
            .filter(friend => friend.country && friend.country.title)
            .map((friend, i) => {
                placemarkContent.push({
                    balloonContentHeader: `<h2 class=ballon_header><b>${ friend.first_name } ${ friend.last_name }</b></h2>`,
                    balloonContentBody: `<img class=ballon_body src=${ friend.photo_200 }>`,
                    clusterCaption: friend.first_name + ' ' + friend.last_name
                })
                if (friend.city) {
                    string = friend.country.title + ' ' + friend.city.title
                } else {
                    string = friend.country.title
                }

                return geocode(string)
                    .then(coord => {
                        return new ymaps.Placemark(coord, placemarkContent[i], {
                            preset: 'islands#redDotIcon'
                        })
                    })
            })

    return Promise.all(promises)
})
.then(placemarks => {
    clusterer.add(placemarks)
})
.catch(e => {
    alert('Произошла ошибка: ' + e.message)
});

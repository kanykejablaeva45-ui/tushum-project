// Пустой список полей, пополняется пользователем
let fieldsData = [];

let map;
let fieldLayers = {};
let selectedField = null;
let currentMapSource = 'bing';
let showFill = true;
let drawControl;
let drawnLayer;
let drawHandler = null;
let inspectionsData = [];
let rotationPlans = [];
let analyticsReports = [];
let referenceChatMessages = [];
let analyticsChartInstance = null;
const cropColorMap = {
    wheat: '#8BC34A',
    barley: '#FFC107',
    soy: '#2196F3',
    peas: '#00BCD4',
    corn: '#FFB74D',
    sunflower: '#FFD54F',
    potato: '#B39DDB',
    cotton: '#AED581',
    berry: '#FF80AB',
    forest: '#A5D6A7',
    unknown: '#E0E0E0'
};
const cropDictionary = {
    wheat: ['пшениц', 'wheat'],
    barley: ['ячмен', 'barley'],
    soy: ['соя', 'soy'],
    peas: ['горох', 'pea'],
    corn: ['кукуруз', 'corn'],
    sunflower: ['подсолнеч', 'sunflower'],
    potato: ['картоф', 'potato'],
    cotton: ['хлопок', 'cotton'],
    berry: ['клубник', 'ягод', 'berry', 'земляник'],
    forest: ['лес', 'forest']
};

// Инициализация карты
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Элемент #map не найден на странице');
        return;
    }
    map = L.map('map', {
        center: [42.79, 74.51],
        zoom: 12,
        zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Базовый слой Bing
    L.tileLayer('https://tiles{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 19
    }).addTo(map);

    // Контрол рисования (только многоугольник)
    drawControl = new L.Control.Draw({
        draw: {
            marker: false,
            circle: false,
            rectangle: false,
            circlemarker: false,
            polyline: false,
            polygon: {
                allowIntersection: false,
                showArea: true,
                drawError: { color: '#f00', timeout: 2000 },
                shapeOptions: { color: '#28a745', weight: 2 }
            }
        },
        edit: false
    });
    map.addControl(drawControl);

    // Слушатель завершения рисования
    map.on(L.Draw.Event.CREATED, onPolygonCreated);

    // Кнопка запуска рисования
    const startBtn = document.getElementById('startDrawBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startDrawing);
    }

    setTimeout(() => loadFields(), 100);
}

// После рисования полигона показываем ввод данных
function onPolygonCreated(e) {
    if (drawnLayer) map.removeLayer(drawnLayer);
    drawnLayer = e.layer;
    if (drawHandler) {
        try { drawHandler.disable(); } catch (err) {}
        drawHandler = null;
    }
    const coords = drawnLayer.getLatLngs()[0].map(p => [p.lat, p.lng]);

    const name = prompt('Введите название поля');
    if (!name) return;

    const crop = prompt('Введите культуру (например, Пшеница)');
    const areaStr = prompt('Введите площадь, га (число)');
    const area = parseFloat(areaStr || '0');
    const cropType = getCropTypeFromName(crop || '');

    const newField = {
        id: `F${Date.now()}`,
        name,
        crop: crop || 'Культура не указана',
        cropType,
        area: isNaN(area) ? 0 : area,
        region: document.getElementById('regionSelect').value === 'all'
            ? 'all'
            : document.getElementById('regionSelect').value,
        coords
    };

    fieldsData.push(newField);
    loadFields();
}

// Загрузка полей (только пользовательские)
function loadFields() {
    const region = document.getElementById('regionSelect').value;
    const filteredFields = region === 'all'
        ? fieldsData
        : fieldsData.filter(f => f.region === region || f.region === 'all');

    Object.values(fieldLayers).forEach(layer => map.removeLayer(layer));
    fieldLayers = {};

    filteredFields.forEach(field => {
        const type = field.cropType && field.cropType !== 'unknown'
            ? field.cropType
            : getCropTypeFromName(field.crop);
        field.cropType = type;
        const color = getFieldColor(type);
        const fillOpacity = showFill ? 0.5 : 0;

        const polygon = L.polygon(field.coords, {
            color: '#ffffff',
            weight: 2.5,
            fillColor: color,
            fillOpacity,
            opacity: 0.9
        }).addTo(map);

        const center = getPolygonCenter(field.coords);
        L.marker(center, {
            icon: L.divIcon({
                className: 'field-label',
                html: `<div style="background: rgba(255,255,255,0.95); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #212529; border: 2px solid ${color}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${field.name}</div>`,
                iconSize: [70, 25],
                iconAnchor: [35, 12]
            })
        }).addTo(map);

        polygon.bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #212529; font-size: 16px;">${field.name}</h3>
                <p style="margin: 4px 0; color: #495057;"><strong>Культура:</strong> ${field.crop}</p>
                <p style="margin: 4px 0; color: #495057;"><strong>Площадь:</strong> ${field.area.toFixed(2)} га</p>
            </div>
        `);

        polygon.on('click', () => selectField(field.id));
        polygon.on('mouseover', function() {
            this.setStyle({ weight: 3.5, opacity: 1 });
        });
        polygon.on('mouseout', function() {
            if (selectedField !== field.id) {
                this.setStyle({ weight: 2.5, opacity: 0.9 });
            }
        });

        fieldLayers[field.id] = polygon;
    });

    if (filteredFields.length > 0 && Object.keys(fieldLayers).length > 0) {
        try {
            const layers = filteredFields.map(f => fieldLayers[f.id]).filter(Boolean);
            if (layers.length > 0) {
                const group = L.featureGroup(layers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        } catch (e) {
            console.log('Автоматическая подстройка масштаба временно недоступна');
        }
    }

    renderFieldsList(filteredFields);
    refreshFieldSelects();
}

function getFieldColor(cropType) {
    return cropColorMap[cropType] || cropColorMap.unknown;
}

function getPolygonCenter(coords) {
    let lat = 0, lng = 0;
    coords.forEach(c => { lat += c[0]; lng += c[1]; });
    return [lat / coords.length, lng / coords.length];
}

function selectField(fieldId) {
    selectedField = fieldId;
    document.querySelectorAll('.field-item').forEach(item => item.classList.remove('selected'));
    const fieldItem = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (fieldItem) {
        fieldItem.classList.add('selected');
        fieldItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    Object.entries(fieldLayers).forEach(([id, layer]) => {
        if (id === fieldId) {
            layer.setStyle({ weight: 4, color: '#4CAF50' });
            map.fitBounds(layer.getBounds(), { padding: [50, 50] });
        } else {
            layer.setStyle({ weight: 2, color: '#ffffff' });
        }
    });
}

function renderFieldsList(fields) {
    const fieldsList = document.getElementById('fieldsList');
    fieldsList.innerHTML = '';
    fields.forEach(field => {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';
        fieldItem.dataset.fieldId = field.id;
        if (selectedField === field.id) fieldItem.classList.add('selected');
        fieldItem.innerHTML = `
            <div class="field-preview ${field.cropType}"></div>
            <div class="field-info">
                <div class="field-name">${field.name}</div>
                <div class="field-crop">${field.crop}</div>
                <div class="field-area">${field.area.toFixed(2)} га</div>
            </div>
        `;
        fieldItem.addEventListener('click', () => selectField(field.id));
        fieldsList.appendChild(fieldItem);
    });
}

function setupEventListeners() {
    document.querySelectorAll('.map-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMapSource = tab.dataset.source;
            updateMapSource();
        });
    });

    document.getElementById('showFill').addEventListener('change', (e) => {
        showFill = e.target.checked;
        updateFieldLayers();
    });

    document.getElementById('fieldSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.field-item').forEach(item => {
            const fieldName = item.querySelector('.field-name').textContent.toLowerCase();
            const fieldCrop = item.querySelector('.field-crop').textContent.toLowerCase();
            item.style.display = (fieldName.includes(searchTerm) || fieldCrop.includes(searchTerm)) ? 'flex' : 'none';
        });
    });

    document.getElementById('regionSelect').addEventListener('change', () => loadFields());
    const deleteFieldBtn = document.getElementById('deleteFieldBtn');
    if (deleteFieldBtn) deleteFieldBtn.addEventListener('click', deleteSelectedField);

    const modal = document.getElementById('alertModal');
    const closeModal = document.querySelector('.close-modal');
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            const category = item.dataset.category;
            showAlertConfig(category);
        });
    });
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    document.getElementById('addAlertBtn').addEventListener('click', () => { addAlert(); });
    const alertsPanel = document.getElementById('alertsPanel');
    const closeAlerts = document.querySelector('.close-alerts');
    closeAlerts.addEventListener('click', () => alertsPanel.classList.remove('active'));

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            const panelId = this.dataset.panel;
            showPanel(panelId);
        });
    });

    bindAIButtons();

    const openAlertSettings = document.getElementById('openAlertSettings');
    if (openAlertSettings) {
        openAlertSettings.addEventListener('click', () => {
            document.getElementById('alertModal').classList.add('active');
        });
    }

    const chatSendBtn = document.getElementById('referenceChatSendBtn');
    const chatInput = document.getElementById('referenceChatInput');
    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', sendReferenceChatMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendReferenceChatMessage();
            }
        });
    }
}

function bindAIButtons() {
    const actions = [
        { id: 'addRotationBtn', handler: addRotationPlanManual },
        { id: 'emptyAddRotation', handler: addRotationPlanManual },
        { id: 'rotationFindBtn', handler: findRotationPlans },
        { id: 'addWorkBtn', handler: generateWorks },
        { id: 'emptyAddWork', handler: generateWorks },
        { id: 'searchTechCardsBtn', handler: generateTechCards },
        { id: 'addInspectionBtn', handler: addInspectionManual },
        { id: 'emptyAddInspection', handler: addInspectionManual },
        { id: 'refreshWeatherBtn', handler: generateWeather },
        { id: 'showWeatherBtn', handler: generateWeather },
        { id: 'addReferenceBtn', handler: generateReference },
        { id: 'emptyAddReference', handler: generateReference },
        { id: 'searchReferenceBtn', handler: generateReference },
        { id: 'buildAnalyticsBtn', handler: buildAnalyticsReport },
        { id: 'buildAnalyticsParamsBtn', handler: buildAnalyticsReport }
    ];
    actions.forEach(action => {
        const btn = document.getElementById(action.id);
        if (btn) btn.addEventListener('click', action.handler);
    });
}

function updateMapSource() {
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    let tileLayer;
    switch(currentMapSource) {
        case 'bing':
            tileLayer = L.tileLayer('https://tiles{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Esri &copy; Esri',
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 19
            });
            break;
        case 'mapbox':
            tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Mapbox © OpenStreetMap',
                maxZoom: 19
            });
            break;
        case 'scheme':
            tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            });
            break;
    }
    tileLayer.addTo(map);
}

function updateFieldLayers() {
    Object.entries(fieldLayers).forEach(([fieldId, layer]) => {
        const field = fieldsData.find(f => f.id === fieldId);
        if (field) {
            const color = getFieldColor(field.cropType);
            layer.setStyle({ fillColor: color, fillOpacity: showFill ? 0.5 : 0 });
        }
    });
}

function startDrawing() {
    if (drawHandler) {
        try { drawHandler.disable(); } catch (err) {}
    }
    drawHandler = new L.Draw.Polygon(map, drawControl.options.draw.polygon);
    drawHandler.enable();
}

function deleteSelectedField() {
    if (!selectedField) {
        showNotification('Нет выбранного поля', 'Выберите поле на карте или в списке');
        return;
    }
    fieldsData = fieldsData.filter(f => f.id !== selectedField);
    if (fieldLayers[selectedField]) {
        map.removeLayer(fieldLayers[selectedField]);
        delete fieldLayers[selectedField];
    }
    selectedField = null;
    loadFields();
    showNotification('Поле удалено', 'Запись и геометрия убраны с карты');
}

function showAlertConfig(category) {
    const config = document.getElementById('alertConfig');
    const title = document.getElementById('alertTitle');
    const description = document.getElementById('alertDescription');
    const configs = {
        weather: { title: 'Погодные оповещения', description: 'Мы сообщим вам о важных изменениях погоды' },
        precipitation: { title: 'Оповещения об осадках', description: 'Получайте уведомления о прогнозируемых осадках' },
        disease: { title: 'Оповещения о болезнях', description: 'Мы сообщим вам, когда заметим изменения здоровья культур' },
        fire: { title: 'Оповещения о пожарах', description: 'Получайте предупреждения о рисках пожара' },
        soil: { title: 'Состояние почвы', description: 'Мониторинг температуры и влажности почвы' },
        satellite: { title: 'Спутниковый мониторинг', description: 'Анализ спутниковых снимков для выявления изменений' },
        floods: { title: 'Оповещения о наводнениях', description: 'Предупреждения о рисках затопления' },
        pests: { title: 'Оповещения о вредителях', description: 'Обнаружение вредителей с помощью ИИ' }
    };
    const cfg = configs[category] || configs.disease;
    title.textContent = cfg.title;
    description.textContent = cfg.description;

    const locationSelect = document.getElementById('alertLocation');
    locationSelect.innerHTML = '<option>Выберите поле</option>';
    fieldsData.forEach(field => {
        const option = document.createElement('option');
        option.value = field.id;
        option.textContent = `${field.name} - ${field.crop}`;
        locationSelect.appendChild(option);
    });

    config.classList.remove('hidden');
}

function addAlert() {
    const category = document.querySelector('.category-item.selected')?.dataset.category;
    const location = document.getElementById('alertLocation').value;
    const eventType = document.querySelector('input[name="eventType"]:checked').value;
    const delivery = document.getElementById('alertDelivery').value;

    if (!category || location === 'Выберите поле') {
        showNotification('Ошибка', 'Пожалуйста, заполните все поля');
        return;
    }
    addAlertToList(category, location, eventType, delivery);
    document.getElementById('alertModal').classList.remove('active');
    document.getElementById('alertsPanel').classList.add('active');
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
    document.getElementById('alertConfig').classList.add('hidden');
}

function addAlertToList(category, location, eventType) {
    const alertsList = document.getElementById('alertsList');
    const field = fieldsData.find(f => f.id === location);
    const alertCard = document.createElement('div');
    const categoryClassMap = {
        weather: 'weather',
        precipitation: 'precipitation',
        disease: 'disease',
        fire: 'fire',
        soil: 'soil',
        satellite: 'satellite',
        floods: 'floods',
        pests: 'pests'
    };
    alertCard.className = `alert-card ${categoryClassMap[category] || 'health'}`;

    const labels = {
        weather: 'Мониторинг погодных условий',
        precipitation: 'Оповещения об осадках',
        disease: 'Мониторинг здоровья культур',
        fire: 'Мониторинг пожарной опасности',
        soil: 'Мониторинг состояния почвы',
        satellite: 'Спутниковый мониторинг',
        floods: 'Мониторинг наводнений',
        pests: 'Мониторинг вредителей'
    };

    alertCard.innerHTML = `
        <div class="alert-label">
            ${labels[category]} - ${field ? field.name : location}
            ${eventType === 'critical' ? ' (Критические)' : ''}
        </div>
        <div class="alert-toggle" onclick="toggleAlert(this)"></div>
    `;
    alertsList.appendChild(alertCard);

    const embedded = document.getElementById('embeddedAlerts');
    if (embedded) {
        const clone = alertCard.cloneNode(true);
        const toggle = clone.querySelector('.alert-toggle');
        if (toggle) toggle.addEventListener('click', () => toggleAlert(toggle));
        embedded.appendChild(clone);
    }
}

function toggleAlert(element) {
    element.classList.toggle('off');
}

function showPanel(panelId) {
    const panels = document.querySelectorAll('.content-panel');
    panels.forEach(p => p.classList.remove('active'));
    const alertsPanel = document.getElementById('alertsPanel');
    if (alertsPanel) alertsPanel.classList.remove('active');

    if (!panelId) return;
    const target = document.getElementById(panelId);
    if (target) {
        target.classList.add('active');
        if (panelId === 'panel-map' && map) {
            setTimeout(() => map.invalidateSize(), 150);
        }
        if (panelId === 'panel-alerts' && alertsPanel) {
            alertsPanel.classList.add('active');
        }
    }
}

function getCropTypeFromName(name) {
    const lower = (name || '').toLowerCase();
    const found = Object.entries(cropDictionary).find(([, keys]) =>
        keys.some(k => lower.includes(k))
    );
    return found ? found[0] : 'unknown';
}

function refreshFieldSelects() {
    const fieldSelect = document.getElementById('weatherFieldSelect');
    if (!fieldSelect) return;
    const current = fieldSelect.value;
    fieldSelect.innerHTML = '<option value="all">Все поля</option>';
    fieldsData.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        fieldSelect.appendChild(opt);
    });
    if ([...fieldSelect.options].some(o => o.value === current)) {
        fieldSelect.value = current;
    }
}

function renderAIResults(containerId, cards) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!cards || !cards.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = '';
    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'ai-card';
        div.innerHTML = `
            <h4>${card.title}</h4>
            <div>${card.text || ''}</div>
            <div class="ai-actions">
                ${(card.chips || []).map(c => `<span class="ai-chip">${c}</span>`).join('')}
            </div>
            ${card.meta ? `<div class="ai-meta">${card.meta}</div>` : ''}
        `;
        container.appendChild(div);
    });
    const empty = container.parentElement?.querySelector('.empty-state');
    if (empty) empty.style.display = 'none';
}

function addRotationPlanManual() {
    const fieldInput = document.getElementById('rotationFieldInput');
    const cropInput = document.getElementById('rotationCropInput');
    const intermInput = document.getElementById('rotationIntermediateInput');
    const lastInput = document.getElementById('rotationLastInput');
    const yearInput = document.getElementById('rotationYearInput');

    const field = fieldInput?.value?.trim() || prompt('Название поля');
    const crop = cropInput?.value?.trim() || prompt('Культура');
    const intermediate = intermInput?.value?.trim() || prompt('Промежуточная культура');
    const lastCrop = lastInput?.value?.trim() || prompt('Последующая культура');
    const year = yearInput?.value || prompt('Год', new Date().getFullYear());

    if (!field || !crop || !year) {
        showNotification('Отмена', 'План не сохранён');
        return;
    }
    const plan = {
        title: `${field} / ${year}`,
        text: `${crop} → ${intermediate || 'сидерат/пар'} → ${lastCrop || 'следующая культура'}`,
        chips: [`Поле: ${field}`, `Год: ${year}`, `Культура: ${crop}`],
        meta: 'Добавлено вручную'
    };
    rotationPlans.unshift(plan);
    renderAIResults('rotationResults', rotationPlans);
    showNotification('Севооборот', 'План добавлен');
}

function findRotationPlans() {
    const field = document.getElementById('rotationFieldInput')?.value?.toLowerCase() || '';
    const crop = document.getElementById('rotationCropInput')?.value?.toLowerCase() || '';
    const interm = document.getElementById('rotationIntermediateInput')?.value?.toLowerCase() || '';
    const last = document.getElementById('rotationLastInput')?.value?.toLowerCase() || '';
    const year = document.getElementById('rotationYearInput')?.value || '';
    const filtered = rotationPlans.filter(p => {
        const t = `${p.title} ${p.text}`.toLowerCase();
        return (!field || t.includes(field)) &&
               (!crop || t.includes(crop)) &&
               (!interm || t.includes(interm)) &&
               (!last || t.includes(last)) &&
               (!year || p.title.includes(year));
    });
    renderAIResults('rotationResults', filtered);
    showNotification('Севооборот', `Найдено планов: ${filtered.length}`);
}

function generateWorks() {
    const cards = [
        { title: 'Опрыскивание гербицидом', text: 'Поле А • 18 мая • Препарат: Глифосат 3 л/га', chips: ['Ответственный: Агронов', 'Статус: Запланировано'], meta: 'Окно без осадков 48 часов' },
        { title: 'Междурядная обработка', text: 'Поле B • 22 мая • Кукуруза', chips: ['Статус: В работе', 'Техника: Культиватор-4'], meta: 'ИИ подобрал дату с минимальным риском уплотнения почвы' }
    ];
    renderAIResults('worksResults', cards);
    showNotification('Работы', 'ИИ предложил ближайшие операции');
}

function generateTechCards() {
    const cards = [
        { title: 'Пшеница озимая / Стандарт', text: 'Основная обработка, посев 180 кг/га, подкормка КАС 200 л/га, защита от болезней', chips: ['Затраты: 34 200 сом/га', 'Прогноз: 4.5 т/га'], meta: 'Нормы рассчитаны по среднему анализу почвы' },
        { title: 'Соя / Интенсив', text: 'Inoculant, посев 70 семян/м², боронование, фунгицид по вегетации', chips: ['Затраты: 29 000 сом/га', 'Прогноз: 2.8 т/га'], meta: 'Учтены ожидаемые осадки в июне' }
    ];
    renderAIResults('techResults', cards);
    showNotification('Техкарты', 'ИИ подготовил 2 шаблона');
}

function addInspectionManual() {
    const place = prompt('Местоположение / поле');
    const issue = prompt('Что обнаружено или нужно сделать?');
    const action = prompt('Действие (например, посадить дерево)');
    if (!place || !issue) {
        showNotification('Отмена', 'Осмотр не сохранён');
        return;
    }
    inspectionsData.unshift({
        title: place,
        text: issue,
        chips: [action || 'Действие не задано'],
        meta: new Date().toLocaleString()
    });
    renderAIResults('inspectionResults', inspectionsData);
    showNotification('Осмотр сохранён', 'Запись добавлена в список');
}

async function generateWeather() {
    const citySelect = document.getElementById('weatherCitySelect');
    const fieldSelect = document.getElementById('weatherFieldSelect');
    const periodSelect = document.getElementById('weatherPeriodSelect');
    const cityValue = citySelect?.value || 'bishkek';
    const cityText = citySelect ? citySelect.options[citySelect.selectedIndex].text : 'Город';
    const fieldText = fieldSelect && fieldSelect.value !== 'all'
        ? (fieldsData.find(f => f.id === fieldSelect.value)?.name || 'Поле')
        : 'Все поля';
    const period = periodSelect?.value || 'week';

    const cityCoords = {
        'bishkek': [42.8746, 74.5698],
        'osh': [40.513, 72.8161],
        'jalal-abad': [40.9333, 73.0],
        'karakol': [42.4907, 78.3936],
        'naryn': [41.4287, 75.9911],
        'talas': [42.5178, 72.2411],
        'batken': [40.062, 70.8194],
        'kant': [42.8911, 74.8508],
        'tokmok': [42.8419, 75.3015],
        'kara-balta': [42.8142, 73.8481]
    };

    let [lat, lon] = cityCoords[cityValue] || cityCoords.bishkek;
    if (fieldSelect && fieldSelect.value !== 'all') {
        const field = fieldsData.find(f => f.id === fieldSelect.value);
        if (field && field.coords?.length) {
            const center = getPolygonCenter(field.coords);
            lat = center[0];
            lon = center[1];
        }
    }

    const daysByPeriod = { week: 7, month: 16, year: 16 };
    const days = daysByPeriod[period] || 7;

    let cards = [];
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=${days}&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        const dates = data.daily.time;
        const tmax = data.daily.temperature_2m_max;
        const tmin = data.daily.temperature_2m_min;
        const precip = data.daily.precipitation_sum;
        cards = dates.map((d, idx) => ({
            title: `${cityText} • ${formatDate(d)}`,
            text: `t° ${tmin[idx]}…${tmax[idx]}°C, осадки ${precip[idx]} мм`,
            chips: ['Источник: open-meteo.com', periodLabel(period)],
            meta: fieldText
        })).slice(0, days);
    } catch (err) {
        cards = [
            { title: `${cityText} • прогноз`, text: '18–22°C, осадки 4 мм', chips: ['Запасной источник данных'], meta: fieldText }
        ];
    }

    renderAIResults('weatherResults', cards);
    showNotification('Погода', 'Обновили прогноз по выбранному пункту');
}

async function generateReference() {
    const queryInput = document.getElementById('referenceQuery');
    const q = queryInput?.value?.trim() || 'агрономия советы';
    let cards = [];
    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1`);
        const data = await res.json();
        const topics = (data.RelatedTopics || []).filter(t => t.Text).slice(0, 5);
        cards = topics.map((t, idx) => ({
            title: t.Text || `Совет ${idx + 1}`,
            text: (t.FirstURL || '').replace('https://', '').replace('http://', ''),
            chips: ['Источник: интернет', 'Похоже на результат поиска'],
            meta: new Date().toLocaleDateString()
        }));
    } catch (e) {
        cards = [
            { title: 'Оптимальный pH', text: 'Поддерживайте pH 6.0–7.0 для зерновых', chips: ['Совет'], meta: 'Локальный справочник' },
            { title: 'Влага почвы', text: 'Полив лучше проводить утром или вечером', chips: ['Совет'], meta: 'Локальный справочник' }
        ];
    }
    renderAIResults('referenceResults', cards);
    showNotification('Справочник', 'Подобраны рекомендации');
}

function buildAnalyticsReport() {
    const metric = document.getElementById('reportMetric')?.value || 'yield';
    const range = document.getElementById('reportRange')?.value || 'season';
    const comment = prompt('Комментарий к отчету (необязательно)') || '';
    const labels = {
        yield: 'Урожайность',
        costs: 'Затраты',
        weather: 'Погодные риски',
        resources: 'Ресурсы'
    };
    const ranges = {
        season: 'За сезон',
        year: 'За год',
        custom: 'Произвольный период'
    };
    const report = {
        title: `${labels[metric] || metric} • ${ranges[range] || range}`,
        text: comment || 'Отчет сформирован. Добавьте данные и диаграммы.',
        chips: ['Параметры заданы пользователем'],
        meta: new Date().toLocaleString()
    };
    analyticsReports.unshift(report);
    renderAIResults('analyticsResults', analyticsReports);
    renderAnalyticsChart(metric);
    showNotification('Аналитика', 'Отчет сформирован');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function periodLabel(period) {
    const map = { week: '7 дней', month: '16 дней (приближенно)', year: 'Прогноз на период' };
    return map[period] || period;
}

function sendReferenceChatMessage() {
    const input = document.getElementById('referenceChatInput');
    const messages = document.getElementById('referenceChatMessages');
    if (!input || !messages) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    referenceChatMessages.push({ role: 'Вы', text });
    const botReply = generateChatBotReply(text);
    referenceChatMessages.push({ role: 'Советник', text: botReply });
    renderChatMessages();
}

function renderChatMessages() {
    const messages = document.getElementById('referenceChatMessages');
    if (!messages) return;
    messages.innerHTML = '';
    referenceChatMessages.slice(-50).forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-message';
        div.innerHTML = `<span class="role">${msg.role}:</span> ${msg.text}`;
        messages.appendChild(div);
    });
    messages.scrollTop = messages.scrollHeight;
}

function generateChatBotReply(question) {
    const lower = question.toLowerCase();
    if (lower.includes('урожай') || lower.includes('yield')) {
        return 'Для роста урожайности: соблюдайте севооборот, давайте сбалансированное питание (NPK), следите за влагой и делайте осмотры на болезни.';
    }
    if (lower.includes('полив') || lower.includes('влага')) {
        return 'Полив проводите утром/вечером, поддерживайте влажность 70-80% ПВ, избегайте переувлажнения.';
    }
    if (lower.includes('болезн') || lower.includes('вредител')) {
        return 'Проведите осмотр очага, примените рекомендованный фунгицид/инсектицид по регламенту и повторите контроль через 5-7 дней.';
    }
    return 'Рекомендация: уточните культуру, фазу развития и проблему — подберу питание, защиту и режим полива.';
}
function renderAnalyticsChart(metric) {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx || !window.Chart) return;
    const labels = ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'];
    const data = [3.2, 3.8, 4.1, 4.4].map(v => metric === 'costs' ? v * 10 : v);
    if (analyticsChartInstance) analyticsChartInstance.destroy();
    analyticsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: metric === 'costs' ? 'Затраты, тыс.' : 'Урожайность, т/га',
                data,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40,167,69,0.1)',
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Небольшая задержка для гарантии, что все элементы загружены
        setTimeout(() => {
            initMap();
            setupEventListeners();
        }, 100);
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        alert('Ошибка загрузки приложения. Проверьте консоль браузера.');
    }
});

function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        z-index: 3000;
        max-width: 350px;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.95;">${message}</div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

window.toggleAlert = toggleAlert;


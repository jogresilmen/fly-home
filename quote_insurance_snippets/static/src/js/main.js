/** @odoo-module **/

// import ajax from 'web.ajax';
import publicWidget from "@web/legacy/js/public/public_widget";

export class PublicWidgetQuoteInsurance extends publicWidget.Widget {
    selector = '.quote_insurance';

    async start() {
        this.passengerCount = 0;
        this.tripCount = 0;
        this.countryData = null;

        try {
            // const data = await ajax.jsonRpc('/get_countries', 'call', {});
            // console.log(data);
            // this._populateSelectOptions('origin-country', data.origin_country);
            // this._populateSelectOptions('destination', data.destination_country);
            // this.countryData = data;
        } catch (error) {
            console.error('Error fetching countries:', error);
        }

        document.querySelector('#typeviaje')?.addEventListener('change', (event) => {
            const selectedType = event.target.value;
            this._handleTravelTypeChange(selectedType);
        });

        document.querySelector('#add-destinations-btn')?.addEventListener('click', () => {
            $('#MultidestinoModal').modal('show');
        });

        document.querySelector('#confirmMultidestino')?.addEventListener('click', () => {
            const destinations = Array.from(document.querySelectorAll('#MultidestinoModal .destination-input'))
                .map(input => input.value);
            const numDestinations = destinations.length;
            const destinationsText = `${numDestinations} destino${numDestinations !== 1 ? 's' : ''}`;
            document.querySelector('#multidestino-destinations').textContent = destinationsText;
            $('#MultidestinoModal').modal('hide');
        });

        const form = document.querySelector('.quote_insurance form');
        form?.addEventListener('submit', (event) => {
            event.preventDefault();
            this._handleFormSubmit(form);
        });

        this._setMinDates('#departure-date', '#return-date');

        document.querySelector('#confirmTravelers')?.addEventListener('click', () => {
            this._updateTravelersCount();
        });
    }

    _populateSelectOptions(selector, options) {
        const selectElement = document.getElementById(selector);
        if (selectElement) {
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.id;
                opt.textContent = option.name;
                selectElement.appendChild(opt);
            });
        }
    }

    _handleTravelTypeChange(selectedType) {
        if (selectedType === 'Multidestino') {
            document.querySelector('#ida-vuelta-fields')?.classList.add('d-none');
            document.querySelector('#multidestino-fields')?.classList.remove('d-none');
        } else if (selectedType === 'anual') {
            document.querySelector('#ida-vuelta-fields')?.classList.add('d-none');
            document.querySelector('#multidestino-fields')?.classList.add('d-none');
        } else {
            document.querySelector('#ida-vuelta-fields')?.classList.remove('d-none');
            document.querySelector('#multidestino-fields')?.classList.add('d-none');
        }
    }

    async _handleFormSubmit(form) {
        const email = document.getElementById('email-address')?.value;
        const phone = document.getElementById('mobile-number')?.value;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^[0-9]{10}$/;

        if (!email || !emailPattern.test(email)) {
            alert('Por favor, ingrese un correo electrónico válido.');
            return;
        }

        if (!phone || !phonePattern.test(phone)) {
            alert('Por favor, ingrese un número de teléfono válido (10 dígitos).');
            return;
        }

        const formData = new FormData(form);
        const serializedFormData = Object.fromEntries(formData.entries());

        try {
            // const data = await ajax.jsonRpc('/get_submit_quote', 'call', { formData: JSON.stringify(serializedFormData) });
            // console.log(data.data);
            // window.location.href = `/pag_plan?id=${data.data}`;
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    }

    _setMinDates(departureSelector, returnSelector) {
        const departureDate = document.querySelector(departureSelector);
        const returnDate = document.querySelector(returnSelector);
        const today = new Date().toISOString().split('T')[0];

        if (departureDate) departureDate.min = today;
        if (returnDate) returnDate.min = today;

        departureDate?.addEventListener('change', () => {
            if (returnDate) returnDate.min = departureDate.value;
        });
    }

    _updateTravelersCount() {
        let totalPassengers = 0;
        document.querySelectorAll('.input-edad').forEach(input => {
            totalPassengers += parseInt(input.value, 10) || 0;
        });
        document.querySelector('#travelers-count').value = `Pasajeros: ${totalPassengers}`;
        $('#travelersModal').modal('hide');
    }
}

publicWidget.registry.PublicWidgetQuoteInsurance = PublicWidgetQuoteInsurance;

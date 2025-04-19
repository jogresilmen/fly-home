/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";
// publicWidget.registry.UnsplashBeacon = publicWidget.Widget.extend({
publicWidget.registry.PublicWidgetQuoteInsurance = publicWidget.Widget.extend({
    selector: '.quote_insurance',

    start: function () {
        var self = this;
        var passengerCount = 0;
        var tripCount = 0;
        tripCount = 0
        var countryData = null;

        jsonrpc('/get_countries', {})
            .then(function (data) {
                // console.log(data);
                self._populateSelectOptions('origin-country', data.origin_country);
                self._populateSelectOptions('destination', data.destination_country);
                self.countryData = data;
            });

        $('#typeviaje').on('change', function () {
            // console.log($(this).val())
            var selectedType = $(this).val();
            if (selectedType === 'Multidestino') {
                $('#ida-vuelta-fields').hide();
                $('#multidestino-fields').show();
            }
            else if (selectedType === 'anual') {
                $('#multidestino-fields').hide();
                $('#ida-vuelta-fields').hide();
            }
            else if (selectedType === 'student') {
                $('#multidestino-fields').hide();
                $('#ida-vuelta-fields').show();
            }
            else {
                $('#ida-vuelta-fields').show();
                $('#multidestino-fields').hide();
            }
        });
        $('#add-destinations-btn').on('click', function () {

            $('#MultidestinoModal').modal('show');
            
        });
        $('#confirmMultidestino').on('click', function () {
            var destinations = [];
            $('#MultidestinoModal .destination-input').each(function () {
                destinations.push($(this).val());
            });
            var numDestinations = destinations.length;
            var destinationsText = numDestinations + (numDestinations === 1 ? ' destino' : ' destinos');
            $('#multidestino-destinations').text(destinationsText);
            $('#MultidestinoModal').modal('hide');
        });

        var $form = $('.quote_insurance form');
        $form.submit(function (event) {
            event.preventDefault();
            var email = $('#email-address').val();
            var phone = $('#mobile-number').val();
            var departureDate = $('#departure-date').val();
            var returnDate = $('#return-date').val();
            var emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            var phonePattern = /^[0-9]{10}$/;
            var today = new Date().toISOString().split('T')[0];
            // console.log(emailPattern.test(email))

            if (!email || !emailPattern.test(email)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }

            if (!phone || !phonePattern.test(phone)) {
                alert('Por favor, ingrese un número de teléfono válido (10 dígitos).');
                return;
            }

            var formData = $(this).serializeArray();
            var serializedFormData = {};
            $.each(formData, function () {
                if (serializedFormData[this.name]) {
                    if (!serializedFormData[this.name].push) {
                        serializedFormData[this.name] = [serializedFormData[this.name]];
                    }
                    serializedFormData[this.name].push(this.value || '');
                } else {
                    serializedFormData[this.name] = this.value || '';
                }
            });

            jsonrpc('/get_submit_quote',{ formData: JSON.stringify(serializedFormData) })
                .then(function (data) {
                    // console.log(data['data'])
                    window.location.href = "/pag_plan?id=" + data['data'];
                }).catch(function (error) {
                    // Handle errors (e.g., show error message)
                    console.error(error);
                });
        });


        // Función para agregar inputs de pasajeros
        function addPassengerInput() {
            var newInput = '';
            $.each(self.countryData.edades, function (index, option) {
                if ($('#origin-id-' + option.id).length === 0) {
                    newInput += '<div class="row align-items-center justify-content-center mb-2">' +
                        '<div class="col-auto">' +
                        '<a class="btn btn-link btn-minus" href="#" data-id="' + option.id + '"><i class="fa fa-minus"></i></a>' +
                        '</div>' +
                        '<div class="col">' +
                        '<label for="origin-id-' + option.id + '" class="form-label mb-0">' + option.name + ':</label>' +
                        '<input type="text" id="origin-id-' + option.id + '" name="person[' + option.id + ']" class="form-control quantity text-center input-edad" data-id="' + option.id + '" value="0">' +
                        '</div>' +
                        '<div class="col-auto">' +
                        '<a class="btn btn-link btn-plus" href="#" data-id="' + option.id + '"><i class="fa fa-plus"></i></a>' +
                        '</div>' +
                        '</div>';
                }
            });

            $('#travelers-selection').append(newInput);

            $(document).off('click', '.btn-plus');
            $(document).off('click', '.btn-minus');

            $(document).on('click', '.btn-plus', function () {
                var inputField = $(this).closest('.row').find('input[data-id="' + $(this).data('id') + '"]');
                var currentValue = parseInt(inputField.val()) || 0;
                inputField.val(currentValue + 1);
            });

            $(document).on('click', '.btn-minus', function () {
                var inputField = $(this).closest('.row').find('input[data-id="' + $(this).data('id') + '"]');
                var currentValue = parseInt(inputField.val()) || 0;
                if (currentValue > 0) {
                    inputField.val(currentValue - 1);
                }
            });
        }

        self._setMinDates('#departure-date', '#return-date');

        // Evento para confirmar y mostrar el número total de pasajeros
        $('#confirmTravelers').on('click', function () {
            var totalPassengers = 0;
            $('.input-edad').each(function () {
                totalPassengers += parseInt($(this).val()) || 0;
            });
            $("#travelers-count").val("Pasajeros: " + totalPassengers);

            $('#travelersModal').modal('hide');


        });


        // function addPassengerInput() {
        //     passengerCount++; // Incrementar el contador
        //     var newInput = '<div class="col-3 imputedad">' +
        //         '<label for="edad[' + passengerCount + ']" class="form-label">Pasajero ' + passengerCount + '</label>' +
        //         '<div class="input-group">' +
        //             '<input type="number"  class="form-control rounded input-edad" id="edad[' + passengerCount + ']" name="edad[' + passengerCount + ']"  placeholder="Edad" />' +
        //           '<div class="input-group-append">'+
        //             '<span class="input-group-text delete-passenger"><i class="fa fa-trash" aria-hidden="true"></i></span>'+
        //           '</div>'+
        //         '</div>' +
        //     '</div>';
        //     $('#travelers-selection').append(newInput);
        // }
        function addAddTripInput() {
            tripCount++; // Incrementar el contador
            var newInput =
                '<div class="col-md-3 mb-3">' +
                '<label for="origin-countryMult[' + tripCount + ']" class="form-label">Country of Origin</label>' +
                '<select class="form-select" id="origin-countryMult[' + tripCount + ']" name="origin_countryMult[' + tripCount + ']">';
            newInput += '<option>Seleccione</option>'
            $.each(self.countryData.origin_country, function (index, option) {
                newInput += '<option value="' + option.id + '">' + option.name + '</option>';
            });

            newInput += '</select>' +
                '</div>' +
                '<div class="col-md-3 mb-3">' +
                '<label for="destinationMult[' + tripCount + ']" class="form-label">Destination</label>' +
                '<select class="form-select destination-input" id="destinationMult[' + tripCount + ']" name="destinationMult[' + tripCount + ']">';
            newInput += '<option>Seleccione</option>'
            $.each(self.countryData.destination_country, function (index, option) {
                newInput += '<option value="' + option.id + '">' + option.name + '</option>';
            });

            newInput += '</select>' +
                '</div>' +
                '<div class="col-md-3 mb-3">' +
                '<label for="departure-dateMult[' + tripCount + ']" class="form-label">Departure</label>' +
                '<input type="date" class="form-control departure-dateMult" id="departure-dateMult[' + tripCount + ']" name="departure_dateMult[' + tripCount + ']"/>' +
                '</div>' +
                '<div class="col-md-3 mb-3">' +
                '<label for="return-dateMult[' + tripCount + ']" class="form-label">Return</label>' +
                '<input type="date" class="form-control return-dateMult" id="return-dateMult[' + tripCount + ']" name="return_dateMult[' + tripCount + ']"/>' +
                '</div>';

            $('#Multidestino-selection').append(newInput);
            self._setMinDates('.departure-dateMult', '.return-dateMult');
        }


        $('#travelers-selection').on('click', '.delete-passenger', function () {
            $(this).closest('.imputedad').remove();
            passengerCount--; // Disminuir el contador
        });

        $('#travelers-count').on('click', function () {
            // Mostrar el modal
            self._showTravelersModal()
            addPassengerInput()
        });

        // Cerrar el modal cuando se haga clic en la 'X'
        $('#myModal .close').on('click', function () {
            $('#myModal').hide();
        });

        $('#exampleModalLongTitle').on('click', function (event) {
            event.preventDefault();
            addPassengerInput();
        });
        $('#AddTrip').on('click', function (event) {
            event.preventDefault();
            addAddTripInput();
        });

        // Confirmar pasajeros
        // $('#confirmTravelers').on('click', function () {
        //     var totalPassengers = $('.input-edad').length;
        //     $("#travelers-count").val("Pasajeros: " + totalPassengers);

        //     // Cerrar el modal usando el método modal('hide')
        //     $('#travelersModal').modal('hide');
        // });
    },

    _showTravelersModal: function () {
        $('#travelersModal').modal('show');
    },

    _setMinDates: function (departureSelector, returnSelector) {
        var self = this;

        function showErrorModal(message) {
            $('#error-message').text(message);
            $('#ErrorModal').modal('show');
        }

        function validateDates() {
            var today = new Date().toISOString().split('T')[0];
            var departureDate = $(departureSelector).val();
            var returnDate = $(returnSelector).val();

            if (departureDate < today) {
                showErrorModal('Departure date cannot be in the past.');
                return false;
            }

            if (returnDate <= departureDate) {
                showErrorModal('Return date must be after the departure date.');
                $(returnSelector).val('');
                return false;
            }

            return true;
        }

        // Establecer la fecha mínima para los campos de fecha
        var today = new Date().toISOString().split('T')[0];
        $(departureSelector).attr('min', today);
        $(returnSelector).attr('min', today);

        // Validar que la fecha de retorno no sea menor o igual a la fecha de salida
        $(departureSelector).on('change', function () {
            var departureDate = $(this).val();
            $(returnSelector).attr('min', departureDate);
            validateDates();
        });

        $(returnSelector).on('change', function () {
            validateDates();
        });
    },


    _populateSelectOptions: function (selectId, optionsData) {
        // console.log(selectId, optionsData)
        var selectElement = $('#' + selectId);
        selectElement.empty(); // Clear existing options
        selectElement.append('<option>Seleccione</option>');
        $.each(optionsData, function (index, option) {
            selectElement.append('<option value="' + option.id + '">' + option.name + '</option>');
        });
    },
});

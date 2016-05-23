var optionsData = new StorageManager('calculationObject',function(calcObj){
    //restore only if options html was saved once
    console.log(calcObj);
    if(calcObj.has('savedTab')) {
        // Fuel type restore
        $('#fuel-type').val(calcObj.get('fuelType'));
        // Fuel Cost restore
        $('#fuel-cost').val(calcObj.get('fuelCost')['value']);
        $('#fuel-cost-unit2').val(calcObj.get('fuelCost')['unit2']);
        //  Storing input field on type
        $($('.emission-input-type')[calcObj.get('savedTab')]).click();

        $('#display-travel-cost').attr('checked', calcObj.get('travelRate').displayTravelCost);

        switch(calcObj.get('savedTab')) {
          case 0 :  $('#consumption').val(calcObj.get('fuelConsumption')['value']);
                    $('#consumption-unit1').val(calcObj.get('fuelConsumption')['unit1']);
                    $('#consumption-unit2').val(calcObj.get('fuelConsumption')['unit2']);
                    break;

          case 1 :  $('#efficiency').val( 1 / calcObj.get('fuelConsumption')['value']);
                    $('#efficiency-unit1').val(calcObj.get('fuelConsumption')['unit2']);
                    $('#efficiency-unit2').val(calcObj.get('fuelConsumption')['unit1']);
                    console.log( 1/calcObj.get('fuelConsumption')['value'] ); 
                    break;

          case 2 :  $('#emission').val(calcObj.get('emissionRate')['value']);
                    $('#emission-unit1').val(calcObj.get('emissionRate')['unit1']);
                    $('#emission-unit2').val(calcObj.get('emissionRate')['unit2']);
                    break;                            
        }
    }
});

//function to switch between tabs and open respective inputs
function openEmissionInput()
{
  //adding selected class to the clicked tab
  $('.emission-input-type.selected').removeClass('selected');
  $(this).addClass(' selected');
  //opening input to the corresponding tab
  var index = $('.emission-input-type.selected').index();
  $('.emission-input.open').removeClass('open');
  $('.emission-input:nth-child('+(index+1)+')').addClass('open');
}



// Function to handle all 3 tabs save  click
function saveOptions() {
  //Saving input type
  optionsData.set('savedTab',$('.emission-input.open').index());
  // Saving PRIMITVE VARIABLES- fuelType
  optionsData.set('fuelType',parseInt(document.getElementById("fuel-type").value));
  // Saving PRIMITVE VARIABLES- fuelCost
  optionsData.set('fuelCost',{
    value: parseFloat(document.getElementById("fuel-cost").value),
    unit1: '$',
    unit2: document.getElementById("fuel-cost-unit2").value,
  });
  optionsData.set('emissionUnit','g');

  /**
  * TO STORE EVERYTYPE OF INFO IN TERMS OF PRIMITVE VARIABLES-
  * fuelConsumption
  */
  switch(optionsData.get('savedTab'))
  {
    case 0: optionsData.set('fuelConsumption',{
              'value': parseFloat($('#consumption').val()),
              'unit1': $('#consumption-unit1').val(), 
              'unit2': $('#consumption-unit2').val(),
            });
            setEmissionRate('g',$('#consumption-unit2').val());
            break;
    case 1: //As fuel consumption = 1/fuel efficiency
            if( !Number.isFinite( 1/$('#efficiency').val() ) ) {
                alert('Fuel efficiency cannot be 0!');
                return;
            }
            optionsData.set('fuelConsumption',{  
              'value': 1/$('#efficiency').val(),
              'unit1': $('#efficiency-unit2').val(), 
              'unit2': $('#efficiency-unit1').val(),
            });  
            setEmissionRate('g',$('#efficiency-unit1').val());
            break;
    case 2: 
            var emission = $('#emission').val(),
                emissionUnit1 = $('#emission-unit1').val(), 
                emissionUnit2 = $('#emission-unit2').val();
            // CONVERSION TO GRAMS  
            emission = Utils.Converter.convert(emission,emissionUnit1,'g')
            // Conversion to fuel efficiency based on fuel type
            var fuelType = optionsData.get('fuelType');
            emission = emission / Utils.fuelInfo[fuelType]['CO2Emission'];

            optionsData.set('fuelConsumption',{
              'value': emission,
              'unit1': 'L', 
              'unit2': emissionUnit2,
            }); 
            // Set emission rate
            setEmissionRate(emissionUnit1,emissionUnit2);
            break;
  }
  //function call to calculate travel rate
  setTravelRate();
  optionsData.update();
  // Update status to let user know options were saved.
  var status = $('#save-message');
  status.html('Saved!');
  setTimeout(function() {
    status.html('');
  }, 750);
}


//function to set emission rate
function setEmissionRate(mUnit,dUnit) {
  var fuelType = optionsData.get('fuelType');
  var consumptionObj = optionsData.get('fuelConsumption');
  var emissionRate = consumptionObj.value;
  //CONVERSION TO STANDARD UNIT AS DATA IS AVAILABLE  IN GRAM/LITER
  // Converts multiplicative unit to Liter
  emissionRate = Utils.Converter.convert(emissionRate,consumptionObj.unit1,'L',consumptionObj.unit2,'km');
  //NOW CONVERTING THE FUEL EFFICIENCY (NOW IN L/KM) TO CARBON EMISSION (in G/KM) for particular fuel type
  console.log(emissionRate,Utils.fuelInfo[fuelType]['CO2Emission']);
  emissionRate = emissionRate * Utils.fuelInfo[fuelType]['CO2Emission'];
  //CONVERSION TO USER PROVIDED UNITS

  //convert to the multiplicative new unit
  emissionRate = Utils.Converter.convert(emissionRate,'g',mUnit,'km',dUnit);
  tp = {
    'value': Math.round(emissionRate * 10000) / 10000,
    'unit1': mUnit,
    'unit2': dUnit,
  }
  console.log(tp);
  optionsData.set('emissionRate',{
    'value': Math.round(emissionRate * 10000) / 10000,
    'unit1': mUnit,
    'unit2': dUnit,
  });
}

//function to set emission rate
function setTravelRate() {
  var fuelCostObj = optionsData.get('fuelCost');
  var consumptionObj = optionsData.get('fuelConsumption');
  var fuelRate = null;
  //cost($/volume) and consumption (volume/distance)
  //if both volume unit are same
  if(fuelCostObj['unit2'] === consumptionObj['unit1']) {
    fuelRate =  fuelCostObj['value'] * consumptionObj['value'];
  }
  //if volume units are different
  else {
    fuelRate = fuelCostObj['value'] * Utils.Converter.convert(consumptionObj['value'],consumptionObj['unit1'],fuelCostObj['unit2']);
  }

  //Fetching display travel cost checkbox value
  var displayTravelCost = document.getElementById("display-travel-cost").checked;
  optionsData.set('travelRate',{
    'value': Math.round(fuelRate * 10000) / 10000,
    'unit1': fuelCostObj['unit1'],
    'unit2': consumptionObj['unit2'],
    "displayTravelCost": displayTravelCost
  });
}


// function to update value on unit change
(function () {
    var previous;
    // console.log('yo',$(".selectMUnit"));
    $(".selectMUnit,.selectDUnit,.selectFUnit").on('focus', function () {
        // Store the current value on focus and on change
        previous = this.value;
    }).change(function() {
        // var to store respective input field and changing via generalised function 
        var inputField;
        if($(this).hasClass('selectMUnit')) {
          inputField = $($(this).parents('.form-group').siblings()[0]).find('input');
          inputField.val(Utils.Converter.convert(inputField.val(),previous,this.value,'none','none'));
        }
        else if($(this).hasClass('selectDUnit')) {
          inputField = $($(this).parents('.form-group').siblings()[0]).find('input');
          inputField.val(Utils.Converter.convert(inputField.val(),'none','none',previous,this.value));
        }
        else if($(this).hasClass('selectFUnit')) {
          inputField = $(this).parents('.form-group').find('input');
          inputField.val(Utils.Converter.convert(inputField.val(),'none','none',previous,this.value));
        }
        // Make sure the previous value is updated
        previous = this.value;
    });
})();


document.addEventListener('DOMContentLoaded', function () {
    //assigning click listener to the save for each tabs
    document.getElementById('save-button').addEventListener('click', saveOptions);

    //assigning click listener to the tabs
    $('.emission-input-type').on('click',openEmissionInput);

    /**
     * Prevents adding Hyphen(-) in the input field.
     */
    $('#consumption,#emission,#efficiency').bind('keypress',function(evtmin){
        if(evtmin.which === 45){
            evtmin.preventDefault();
        }
    });

    // Added multiple language support. replaces text with user language
    for(var i=0;i< $('[data-language]').length;++i) {
        $($('[data-language]')[i]).html(chrome.i18n.getMessage($($('[data-language]')[i]).data('language'))) 
    }
});

googleAnalytics('UA-1471148-11');

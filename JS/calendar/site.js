// call this from the developer console and you can control both instances
var calendars = {};

$(document).ready( function() {

  // assuming you've got the appropriate language files,
  // clndr will respect whatever moment's language is set to.
  // moment.lang('ru');

  // here's some magic to make sure the dates are happening this month.
  var thisMonth = moment().format('YYYY-MM');

  var eventArray = [
    { startDate: thisMonth + '-10', endDate: thisMonth + '-14', title: 'Multi-Day Event' },
    { startDate: thisMonth + '-21', endDate: thisMonth + '-23', title: 'Another Multi-Day Event' }
  ];

  // the order of the click handlers is predictable.
  // direct click action callbacks come first: click, nextMonth, previousMonth, nextYear, previousYear, or today.
  // then onMonthChange (if the month changed).
  // finally onYearChange (if the year changed).

  calendars.clndr1 = $('.cal1').clndr({
    events: eventArray,
     constraints:{
      startDate: '2021-03-01',
      endDate: '2025-11-15'
     },
    clickEvents: {
      click: function(target) {
        selDate = target.date._d;
        console.log(target.date._d);
        if($(target.element).hasClass('inactive')) {
          console.log('not a valid datepicker date.');
        } else {
          document.querySelector("#dateInput").dataset.year = target.date._a[0];
          var month = target.date._a[1]+1;
          if(month < 10) // Add leading Zero
          {
              month = "0" + month;
          }
          document.querySelector("#dateInput").dataset.month = month;
          var date = target.date._a[2];
          if(date < 10) // Add leading Zero
          {
              date = "0" + date;
          }
          document.querySelector("#dateInput").dataset.day = date;
          document.querySelector("#dateInput").value = date+ "/" + month + "/" + target.date._a[0];
          showElement("calendar", false);
        }
      },
      nextMonth: function() {
        console.log('next month.');
      },
      previousMonth: function() {
        console.log('previous month.');
      },
      onMonthChange: function() {
        console.log('month changed.');
      },
      nextYear: function() {
        console.log('next year.');
      },
      previousYear: function() {
        console.log('previous year.');
      },
      onYearChange: function() {
        console.log('year changed.');
      }
    },
    multiDayEvents: {
      startDate: 'startDate',
      endDate: 'endDate'
    },
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false
  });
});
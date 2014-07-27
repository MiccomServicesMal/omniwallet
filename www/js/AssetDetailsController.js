function AssetDetailsController($route, $scope, $timeout, $element, $compile, propertiesService, userService){
  // $scope initialization
  $scope.propertyId = $route.current.params.propertyId;
  $scope.property = {
    "name" : "",
    "category" : "",
    "subcategory" : "",
    "data" : "",
    "url" : "",
    "divisible" : true,
    "issuer" : "",
    "creationtxid" : "",
    "fixedissuance" : false,
    "totaltokens" : 0
  };
  
  $scope.crowdsale = {
    "name" : "",
    "active" : true,
    "issuer" : "",
    "propertyiddesired" : null,
    "tokensperunit" : 0,
    "earlybonus" : 0,
    "percenttoissuer" : 0,
    "starttime" : 0,
    "deadline" : 0,
    "amountraised" : 0,
    "tokensissued" : 0
  };
  
  $scope.isOwner = false;
  $scope.acceptedCurrencies = [];
  $scope.formatedStartDate = "";
  $scope.daysAgo = 0;
  $scope.earlyBirdBonus =  0;
  $scope.estimatedWorth = "0";
  $scope.history = {
    total:0,
    transactions:[]
  };
  $scope.infoMessage = "Get some tokens!";
  
  // Parsing and format functions
  $scope.formatTransactionTime = function(blocktime, format){
    format = format || "locale";
    var time = new Date(blocktime * 1000);
    if (format == "elapsed") {
      var now = new Date();
      var off = (now.getTime() / 1000) - blocktime;
      switch(off){
        case off < 60:
          return "Just now";
          break;
        case off < 3600:
          return Math.round(off / 60) + "minutes ago";
          break;
        case off < 86400:
          return Math.round(off / 3600) + "hours ago";
          break;
        case off < 604800:
          return Math.round(off / 86400) + "days ago";
          break;
        case off < 2592000:
          return Math.round(off / 604800) + "weeks ago";
          break;
        case off < 31536000:
          return Math.round(off / 2592000) + "months ago";
          break;
        default:
          return Math.round(off / 31536000) + "years ago";
          break;
      }
    } else {
      return time.toLocaleString();
    }
  };
  
  $scope.formatCurrencyName = function (propertyid) {
    for(var currency in $scope.acceptedCurrencies){
      if(currency.propertyid == propertyid)
        return currency.name;
    }
    
    return "Unknown";
  };
  
  // Load property data into the page
  propertiesService.getProperty($scope.propertyId).then(function(result){
    $scope.property = result.data;
    
    if(!$scope.property.fixedissuance)
    {
      propertiesService.getCrowdsale($scope.propertyId).then(function(result){
        $scope.crowdsale = result.data;
        
        $scope.isOwner = userService.loggedIn() && userService.getAddressesWithPrivkey().indexOf($scope.crowdsale.issuer) > -1;
        propertiesService.getProperty($scope.crowdsale.propertyiddesired).then(function(result){
          $scope.acceptedCurrencies = [{propertyid:$scope.crowdsale.propertyiddesired,name:result.data.name,rate:$scope.crowdsale.tokensperunit}];
        });
        
        var startDate = new Date($scope.crowdsale.starttime*1000);
        $scope.formatedStartDate = startDate.toLocaleDateString();
        
        var now = new Date();
        $scope.daysAgo = Math.round((now.getTime() - startDate.getTime()) / (1000*60*60*24));
        $scope.earlyBirdBonus =  ((($scope.crowdsale.deadline - (now.getTime()/1000)) / 604800) * $scope.crowdsale.earlybonus).toFixed(1);
        $scope.estimatedWorth = "0";
        
        // we need to compile the timer dinamically to get the appropiate end-date set.
        var endtime = $scope.crowdsale.deadline * 1000;
        $timeout(function (){
          var timerNode = $('<timer end-time='+endtime+'> \
            <span class="countdown-group"> \
              <span class="countdown-number">{{days}}</span> \
              <div class="countdown-label">day{{daysS}}</div> \
            </span> \
            : \
            <span class="countdown-group"> \
              <span class="countdown-number">{{hours}}</span> \
              <div class="countdown-label">hour{{hoursS}}</div> \
            </span> \
            : \
            <span class="countdown-group"> \
              <span class="countdown-number">{{minutes}}</span> \
              <div class="countdown-label">minute{{minutesS}}</div> \
            </span> \
            : \
            <span class="countdown-group"> \
              <span class="countdown-number">{{seconds}}</span> \
              <div class="countdown-label">second{{secondsS}}</div> \
            </span> \
          </timer>');
          $element.find('#timerWrapper').append(timerNode);
          $compile(timerNode)($scope);
        });
      });
      
      propertiesService.getCrowdsaleHistory($scope.propertyId,0,5).then(function(result){
        $scope.history = result.data;
      });
    }
  });
  
  
}
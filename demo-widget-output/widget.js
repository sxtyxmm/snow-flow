function(spUtil) {
  var c = this;
  
  // Initialize widget
  c.init = function() {
    c.data = c.data || {};
    c.data.title = c.options.title || 'Smart AI Widget';
    c.loadCount();
    
    
  };
  
  
  // Load record count
  c.loadCount = function() {
    c.server.get({
      table: 'task',
      action: 'count'
    }).then(function(response) {
      c.data.count = response.data.count || 0;
    });
  };
  
  
  
  
  
  
  // Initialize widget on load
  c.init();
}
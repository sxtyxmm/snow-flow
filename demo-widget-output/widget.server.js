(function() {
  var action = input.action || 'load';
  var table = input.table || 'task';
  
  // Initialize data object
  data.title = options.title || 'Smart AI Widget';
  data.widget_type = 'counter';
  
  switch(action) {
    
    case 'count':
      var gr = new GlideRecord(table);
      gr.addActiveQuery();
      gr.query();
      data.count = gr.getRowCount();
      break;
    
    
    
    
    
    
    default:
      // Default load action
      data.initialized = true;
      break;
  }
  
  // Add metadata
  data.table = table;
  data.generated_by = 'Snow-flow Demo Mode';
  data.generated_at = new GlideDateTime().getDisplayValue();
})();
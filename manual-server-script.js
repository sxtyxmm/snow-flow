// Manual Server Script for OpenAI Incident Classification Widget
// Copy and paste this script directly into the ServiceNow Widget Editor

(function() {
  // Server-side script for OpenAI Incident Classification Widget
  
  var OpenAIIncidentClassifier = {
    
    // Main data processing function
    processRequest: function(action, params) {
      try {
        switch (action) {
          case 'get_incidents':
            return this.getIncidents(params);
          case 'reclassify_incident':
            return this.reclassifyIncident(params.incident_id);
          default:
            return { success: false, error: 'Invalid action' };
        }
      } catch (error) {
        gs.error('OpenAI Incident Classifier Error: ' + error.message);
        return { success: false, error: error.message };
      }
    },
    
    // Get incidents with classification data
    getIncidents: function(params) {
      var startTime = new Date().getTime();
      
      // Parse parameters
      var startDate = params.start_date || this.getDateDaysAgo(7);
      var endDate = params.end_date || this.getDateToday();
      var priority = params.priority || '';
      var page = parseInt(params.page) || 1;
      var pageSize = parseInt(params.page_size) || 10;
      
      // Build query for incidents
      var incidentGR = new GlideRecord('incident');
      incidentGR.addQuery('sys_created_on', '>=', startDate);
      incidentGR.addQuery('sys_created_on', '<=', endDate + ' 23:59:59');
      
      if (priority) {
        incidentGR.addQuery('priority', priority);
      }
      
      incidentGR.orderByDesc('sys_created_on');
      incidentGR.query();
      
      var totalRecords = incidentGR.getRowCount();
      var incidents = [];
      var skip = (page - 1) * pageSize;
      var count = 0;
      
      while (incidentGR.next()) {
        if (count < skip) {
          count++;
          continue;
        }
        
        if (incidents.length >= pageSize) {
          break;
        }
        
        var incident = this.processIncident(incidentGR);
        incidents.push(incident);
        count++;
      }
      
      // Calculate statistics
      var statistics = this.calculateStatistics(incidents);
      statistics.processingTime = ((new Date().getTime() - startTime) / 1000).toFixed(2);
      
      return {
        success: true,
        incidents: incidents,
        statistics: statistics,
        total_records: totalRecords
      };
    },
    
    // Process individual incident
    processIncident: function(incidentGR) {
      var incident = {
        sys_id: incidentGR.getUniqueValue(),
        number: incidentGR.getDisplayValue('number'),
        short_description: incidentGR.getDisplayValue('short_description'),
        description: incidentGR.getDisplayValue('description'),
        priority: incidentGR.getValue('priority'),
        priority_label: incidentGR.getDisplayValue('priority'),
        created_date: incidentGR.getDisplayValue('sys_created_on'),
        ai_classification: incidentGR.getValue('u_ai_classification'),
        ai_confidence: parseFloat(incidentGR.getValue('u_ai_confidence')) || 0,
        ai_classification_date: incidentGR.getDisplayValue('u_ai_classification_date')
      };
      
      // Classify if not already classified
      if (!incident.ai_classification) {
        var classification = this.classifyIncident(incident);
        if (classification.success) {
          incident.ai_classification = classification.category;
          incident.ai_confidence = classification.confidence;
          
          // Update the incident record
          this.updateIncidentClassification(incident.sys_id, classification);
        } else {
          incident.ai_classification = 'Other';
          incident.ai_confidence = 50;
        }
      }
      
      return incident;
    },
    
    // Classify incident using OpenAI or fallback logic
    classifyIncident: function(incident) {
      // Try OpenAI classification first
      var openaiResult = this.classifyWithOpenAI(incident);
      if (openaiResult.success) {
        return openaiResult;
      }
      
      // Fallback to rule-based classification
      return this.classifyWithRules(incident);
    },
    
    // Classify incident using OpenAI API
    classifyWithOpenAI: function(incident) {
      try {
        var apiKey = gs.getProperty('x_openai.api_key');
        if (!apiKey) {
          return { success: false, error: 'OpenAI API key not configured' };
        }
        
        var requestBody = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an IT incident classification expert. Classify incidents into these categories: Hardware, Software, Network, Security, Access, Other. Respond with JSON format: {"category": "category_name", "confidence": confidence_score_0_to_100, "reasoning": "brief_explanation"}'
            },
            {
              role: 'user',
              content: 'Classify this incident:\\nTitle: ' + incident.short_description + '\\nDescription: ' + incident.description
            }
          ],
          max_tokens: 150,
          temperature: 0.3
        };
        
        var request = new sn_ws.RESTMessageV2();
        request.setEndpoint('https://api.openai.com/v1/chat/completions');
        request.setHttpMethod('POST');
        request.setRequestHeader('Authorization', 'Bearer ' + apiKey);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestBody(JSON.stringify(requestBody));
        
        var response = request.execute();
        var responseCode = response.getStatusCode();
        
        if (responseCode === 200) {
          var responseBody = JSON.parse(response.getBody());
          var content = responseBody.choices[0].message.content;
          
          try {
            var result = JSON.parse(content);
            return {
              success: true,
              category: result.category,
              confidence: result.confidence,
              reasoning: result.reasoning
            };
          } catch (parseError) {
            return { success: false, error: 'Failed to parse OpenAI response' };
          }
        } else {
          return { success: false, error: 'OpenAI API error: ' + responseCode };
        }
      } catch (error) {
        return { success: false, error: 'OpenAI classification failed: ' + error.message };
      }
    },
    
    // Fallback rule-based classification
    classifyWithRules: function(incident) {
      var text = (incident.short_description + ' ' + incident.description).toLowerCase();
      
      // Hardware keywords
      if (text.match(/hardware|computer|laptop|desktop|monitor|printer|mouse|keyboard|server|disk|memory|cpu/)) {
        return { success: true, category: 'Hardware', confidence: 70, reasoning: 'Keyword-based classification' };
      }
      
      // Software keywords
      if (text.match(/software|application|program|system|error|bug|crash|install|update|patch/)) {
        return { success: true, category: 'Software', confidence: 70, reasoning: 'Keyword-based classification' };
      }
      
      // Network keywords
      if (text.match(/network|internet|connection|wifi|ethernet|vpn|firewall|router|switch|bandwidth/)) {
        return { success: true, category: 'Network', confidence: 70, reasoning: 'Keyword-based classification' };
      }
      
      // Security keywords
      if (text.match(/security|virus|malware|phishing|breach|unauthorized|password|access|permissions/)) {
        return { success: true, category: 'Security', confidence: 70, reasoning: 'Keyword-based classification' };
      }
      
      // Access keywords
      if (text.match(/access|login|password|account|user|authentication|authorization|permission/)) {
        return { success: true, category: 'Access', confidence: 70, reasoning: 'Keyword-based classification' };
      }
      
      // Default to Other
      return { success: true, category: 'Other', confidence: 50, reasoning: 'No specific keywords found' };
    },
    
    // Update incident classification in database
    updateIncidentClassification: function(incidentId, classification) {
      var incidentGR = new GlideRecord('incident');
      if (incidentGR.get(incidentId)) {
        incidentGR.setValue('u_ai_classification', classification.category);
        incidentGR.setValue('u_ai_confidence', classification.confidence);
        incidentGR.setValue('u_ai_classification_date', new GlideDateTime());
        incidentGR.update();
      }
    },
    
    // Reclassify incident
    reclassifyIncident: function(incidentId) {
      var incidentGR = new GlideRecord('incident');
      if (!incidentGR.get(incidentId)) {
        return { success: false, error: 'Incident not found' };
      }
      
      var incident = {
        sys_id: incidentGR.getUniqueValue(),
        short_description: incidentGR.getDisplayValue('short_description'),
        description: incidentGR.getDisplayValue('description')
      };
      
      var classification = this.classifyIncident(incident);
      if (classification.success) {
        this.updateIncidentClassification(incidentId, classification);
        return { success: true, message: 'Incident reclassified successfully' };
      } else {
        return { success: false, error: 'Failed to reclassify incident' };
      }
    },
    
    // Calculate statistics
    calculateStatistics: function(incidents) {
      var stats = {
        totalIncidents: incidents.length,
        classifiedIncidents: 0,
        averageConfidence: 0,
        processingTime: 0
      };
      
      var totalConfidence = 0;
      incidents.forEach(function(incident) {
        if (incident.ai_classification && incident.ai_classification !== 'Other') {
          stats.classifiedIncidents++;
        }
        totalConfidence += incident.ai_confidence;
      });
      
      if (incidents.length > 0) {
        stats.averageConfidence = Math.round(totalConfidence / incidents.length);
      }
      
      return stats;
    },
    
    // Utility functions
    getDateDaysAgo: function(days) {
      var date = new Date();
      date.setDate(date.getDate() - days);
      return date.toISOString().split('T')[0];
    },
    
    getDateToday: function() {
      return new Date().toISOString().split('T')[0];
    }
  };
  
  // Main execution based on input
  if (input && input.action) {
    data.result = OpenAIIncidentClassifier.processRequest(input.action, input.params || {});
  } else {
    // Default initialization
    data.result = {
      success: true,
      message: 'Widget initialized successfully',
      config: {
        supports_openai: !!gs.getProperty('x_openai.api_key'),
        fallback_enabled: true
      }
    };
  }
  
})();
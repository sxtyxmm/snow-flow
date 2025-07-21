# Consul Template configuration for dynamic nginx upstream configuration

consul {
  address = "consul:8500"
  retry {
    enabled = true
    attempts = 12
    backoff = "250ms"
    max_backoff = "1m"
  }
}

reload_signal = "SIGHUP"
kill_signal = "SIGINT"
max_stale = "10m"
log_level = "info"

# Template for main nginx configuration
template {
  source = "/etc/consul-template/templates/nginx.conf.tpl"
  destination = "/etc/nginx/nginx.conf"
  create_dest_dirs = true
  command = "nginx -t && nginx -s reload"
  command_timeout = "60s"
  error_on_missing_key = false
  perms = 0644
  backup = true
  left_delimiter = "{{"
  right_delimiter = "}}"
  wait {
    min = "2s"
    max = "10s"
  }
}

# Template for individual service upstreams (for more granular control)
template {
  source = "/etc/consul-template/templates/upstreams.conf.tpl"
  destination = "/etc/nginx/conf.d/upstreams.conf"
  create_dest_dirs = true
  command = "nginx -t && nginx -s reload"
  command_timeout = "60s"
  error_on_missing_key = false
  perms = 0644
  backup = true
  wait {
    min = "2s"
    max = "10s"
  }
}

# Template for service status monitoring
template {
  source = "/etc/consul-template/templates/status.json.tpl"
  destination = "/var/www/html/status.json"
  create_dest_dirs = true
  error_on_missing_key = false
  perms = 0644
  backup = false
  wait {
    min = "5s"
    max = "15s"
  }
}
module.exports = {
  apps: [{
    name: 'portal',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: '/var/log/portal/err.log',
    out_file: '/var/log/portal/out.log',
  }],
}

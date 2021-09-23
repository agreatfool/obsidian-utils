# obsidian-utils

Command line tools to help obsidian stuff

## Working steps

1. Select location point
2. Select date & edit time
3. Fetch weather data
4. Edit the title & slug
5. Confirm the frontmatter generated
6. Submit the data, then you can see the dir & md file generated

## Preparation

This tool is using:

- [amap 高德地图](https://lbs.amap.com/) as the location service
- [nowapi](https://www.nowapi.com/api/weather.today) as the weather service

You will need to prepare:

- Go to the console of amap 高德地图 to generate two keys:
    - amapWebKey: Web服务 ; used to call restful apis
    - amapJsKey: Web端（JS API）; used to fetch location in embedded web component
- Go to the console of nowapi to get:
    - nowapiAppKey: appkey ; used to call api
    - nowapiSign: sign ; used to call api

## How to use

Write a config file `obsidian_utils_config.yaml`, it's recommended to be put in your obsidian vault dir. It's content:

```yaml
amapJsKey: "..."
amapWebKey: "..."
nowapiAppKey: "..."
nowapiSign: "..."
```

```bash
$ obsidian-utils -d ~/Downloads/your/vault -c ~/Downloads/your/vault/obsidian_utils_config.yaml
```

## Others

obsidian-utils help:

```bash
✗ obsidian-utils -h
Usage: obsidian-utils [options]

Obsidian utility, help to generate frontmatter, etc

Options:
  -V, --version        output the version number
  -d, --dest <dir>     directory of output destination
  -c, --config <path>  file path of the config yaml, example could be find at:
                       ${source_root}/config.example.yaml
  -h, --help           display help for command
```
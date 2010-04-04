#!/usr/bin/ruby
require 'rubygems'
require 'json'
require 'yaml'
require 'base64'

yaml_date = YAML.load_file(".couchitter.yaml") || {}
@username, @password = yaml_date["username"], yaml_date["password"]
@host = yaml_date["host"] || "127.0.0.1"
@port = yaml_date["port"] || "5984"

def get_json_from_output_of(command)
  response = `#{command}`
  JSON.parse(response)
end

def database_string
  str = "http://"
  str += "#{@username}:#{@password}@" if @username && @password
  str + "#{@host}:#{@port}/couchitter"
end

def existing_design_doc
  return @existing_design_doc if @existing_design_doc
  response ||= get_json_from_output_of(%Q{curl -X "GET" '#{database_string}/_design/couchitter'})
  @existing_design_doc = response["_rev"]
end

def json_to_push(files)
  json = {
    "_id" => "_design/couchitter",
    "_attachments" => {}
  }
  
  json["_rev"] = existing_design_doc if existing_design_doc
  
  files.inject(json) do |hash, file_info|
    file_path = file_info[0]
    file_name = File.basename file_path
    content_type = file_info[1]
    
    hash["_attachments"][file_name] = {
      "content_type" => content_type,
      "data" => Base64.encode64(File.read(file_path))
    }
    
    hash
  end
end

def push_attachments(files)
  response = get_json_from_output_of(%Q{curl -X "PUT" -d '#{json_to_push(files).to_json}' '#{database_string}/_design/couchitter'})
  puts response.inspect
end

push_attachments [["javascripts/jquery.js", "text/javascript"],
                  ["javascripts/jcouchquery.js", "text/javascript"],
                  ["javascripts/couchitter.js", "text/javascript"],
                  ["stylesheets/couchitter.css", "text/javascript"],
                  ["index.html", "text/html"]]

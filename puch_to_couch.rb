#!/usr/bin/ruby
require 'rubygems'
require 'json'
require 'yaml'
require 'base64'

yaml_date = YAML.load_file(".couchitter.yaml") || {}
@host = ARGV[0] || yaml_date["host"] || "127.0.0.1"
@username = ARGV[1] || yaml_date["username"]
@password = ARGV[2] || yaml_date["password"]
@port = ARGV[3] || yaml_date["port"] || "5984"

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

def json_to_push(attachments, views)
  json =   
  attachments.inject( { "_id" => "_design/couchitter", "_attachments" => {} } ) do |hash, file_info|
    file_path = file_info[0]
    file_name = File.basename file_path
    content_type = file_info[1]
    
    hash["_attachments"][file_name] = {
      "content_type" => content_type,
      "data" => Base64.encode64(File.read(file_path))
    }
    
    hash
  end
  
  json["_rev"] = existing_design_doc if existing_design_doc
  json["views"] = YAML.load_file(views)
  json
end

def push_design_doc(options)
  attachments = options[:attachments]
  views = options[:views]
  response = get_json_from_output_of(%Q{curl -X "PUT" -d '#{json_to_push(attachments, views).to_json}' '#{database_string}/_design/couchitter'})
  puts response.inspect
end

def create_database
  response = get_json_from_output_of(%Q{curl -X "PUT" '#{database_string}'})
  puts response.inspect
end

create_database
push_design_doc({
  :attachments => [["javascripts/jquery.js", "text/javascript"], ["javascripts/jcouchquery.js", "text/javascript"],
                   ["javascripts/couchitter.js", "text/javascript"], ["stylesheets/couchitter.css", "text/javascript"],
                    ["index.html", "text/html"]],
  :views => "views.yaml"
})
                  

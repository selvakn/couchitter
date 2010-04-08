watch('.*') do |file|
	system("ruby puch_to_couch.rb 127.0.0.1 admin admin")
	system("ruby puch_to_couch.rb 10.5.3.73 admin admin")
end
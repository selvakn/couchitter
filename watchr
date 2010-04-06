watch('.*') do |file|
	system("ruby puch_to_couch.rb 127.0.0.1 admin admin")
end
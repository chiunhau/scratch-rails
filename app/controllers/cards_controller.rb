class CardsController < ApplicationController
  require 'base64'
  def index
  	@cards = Card.all
  end

  def create
  	@card = Card.new(card_params)
  	if @card.save
  		render :nothing => true
  	end

    data = card_params[:url]
    image_data = Base64.decode64(data['data:image/png;base64,'.length .. -1])
    
    File.open("#{Rails.root}/public/store/somefilename.png", 'wb') do |f|
      f.write image_data
    end
  end

  def show
    @card = Card.find(params[:id])
    
  end

  private
    def card_params
      params.require(:card).permit(:url)
    end
end

class CardsController < ApplicationController
  require 'base64'

  def index
  	latest_card = Card.last
    @latest_id = latest_card.id
  end

  def create
  	@card = Card.new(card_params)
  	if @card.save
  		render :json => @card.id
  	end

    data = card_params[:url]
    image_data = Base64.decode64(data['data:image/png;base64,'.length .. -1])
    
    File.open("#{Rails.root}/public/store/#{@card.id}.png", 'wb') do |f|
      f.write image_data
    end
  end

  def show
    redirect_to "/store/#{params[:id]}.png"
  end

  private
    def card_params
      params.require(:card).permit(:url)
    end
end

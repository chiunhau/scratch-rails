class CardsController < ApplicationController
  require 'base64'

  def index
    cards = Card.all
    @card_ids = Array.new
    
    cards.each do |card|
      @card_ids.push(card.id)
    end
  end

  def create
  	@card = Card.new(card_params)
  	if @card.save
  		render :json => @card
  	end

    data = card_params[:url]
    image_data = Base64.decode64(data['data:image/png;base64,'.length .. -1])
    
    File.open("#{Rails.root}/public/store/#{@card.id}.png", 'wb') do |f|
      f.write image_data
    end

    convert_to_grayscale(@card.id)
    convert_to_thumbnail(@card.id)
  end

  def convert_to_thumbnail(card_id)
    image = MiniMagick::Image.open("#{Rails.root}/public/store/#{card_id}.png")
    image.resize "250x250"
    image.write "#{Rails.root}/public/store/thumb/#{@card.id}.png"
  end

  def convert_to_grayscale(card_id)
    image = MiniMagick::Image.open("#{Rails.root}/public/store/#{card_id}.png")
    image.colorspace("Gray")
    image.brightness_contrast("50x50")
    logo = MiniMagick::Image.new("#{Rails.root}/public/inno.png")
    result = image.composite(logo) do |c|
      c.compose "Over"    
      c.geometry "+20+20"
    end
    result.write "#{Rails.root}/public/store/grayscale/#{card_id}.png"
  end

  def show
    @card_id = Card.find(params[:id]).id
  end

  private
    def card_params
      params.require(:card).permit(:url)
    end
end
